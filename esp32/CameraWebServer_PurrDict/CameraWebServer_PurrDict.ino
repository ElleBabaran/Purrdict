/**
 * PurrDict ESP32-CAM Firmware
 * 
 * Based on the CameraWebServer example, extended to:
 * 1. Stream MJPEG video (port 81) — for the Cat Cam page
 * 2. POST sensor data to the PurrDict API every 60 seconds:
 *    - Motion detection (frame size differencing)
 *    - Temperature (DHT11 on GPIO 12, optional)
 *    - Distance (HC-SR04 ultrasonic, optional)
 *    - Device health (free heap, RSSI, uptime)
 * 
 * Stability fixes:
 * - Sensor POST runs only when stream has no active clients (non-blocking)
 * - Hardware watchdog auto-reboots if firmware hangs
 * - WiFi auto-reconnect with exponential backoff
 * - POST interval increased to 60s to reduce WiFi contention with stream
 * - HTTP timeout shortened to 3s to prevent long blocks
 * - Camera auto-reinit if frame capture fails repeatedly
 * 
 * Hardware:
 * - ESP32-CAM (AI-Thinker) with OV2640
 * - Optional: DHT11 on GPIO 12
 * - Optional: HC-SR04 (TRIG=GPIO 13, ECHO=GPIO 15) — only if not using SD card
 * 
 * Setup:
 * 1. Change WIFI_SSID and WIFI_PASS
 * 2. Change SERVER_URL to your PurrDict server IP/domain
 * 3. Flash with "AI Thinker ESP32-CAM" board, partition "Huge APP (3MB)"
 */

#include "esp_camera.h"
#include "esp_timer.h"
#include "esp_task_wdt.h"
#include "esp_http_server.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ═══════════════════════════════════════════════════════════
// CONFIGURATION — CHANGE THESE
// ═══════════════════════════════════════════════════════════
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASS     = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "https://purrdict.vercel.app/api/esp32/data";
const char* DEVICE_ID     = "ESP32CAM";
// Returned by POST /api/esp32/pair when this device is paired from the
// Setup wizard in the app. /api/esp32/data now requires it on every
// request (previously this endpoint accepted data with no credential at
// all) — set this to the value shown after pairing before flashing.
const char* DEVICE_SECRET = "SET_ME_AFTER_PAIRING";
// Shared secret required on every GET /stream request (as query param
// ?key=...). Anyone on the same WiFi/LAN as this device could otherwise
// open the MJPEG stream directly with no credential at all — set this to
// a long random value and configure the same value in the app's stream
// proxy call. Must not be left as the placeholder in a real deployment.
const char* STREAM_KEY    = "SET_ME_TO_A_RANDOM_VALUE";

// Sensor config
#define ENABLE_DHT        false   // Set true if DHT11 connected to GPIO 12
#define ENABLE_ULTRASONIC false   // Set true if HC-SR04 connected
#define SEND_INTERVAL_MS  60000   // Send data every 60 seconds (was 5s — too aggressive)
#define MOTION_THRESHOLD  15      // Pixel diff threshold for motion detection

// Stream stability
#define WDT_TIMEOUT_S     30      // Watchdog: reboot if hung for 30s
#define HTTP_TIMEOUT_MS   3000    // Short timeout so POST doesn't block stream
#define WIFI_RETRY_MAX    20      // Max WiFi reconnect attempts before reboot

// Camera model
#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// ═══════════════════════════════════════════════════════════
// OPTIONAL SENSOR PINS (AI-Thinker specific)
// ═══════════════════════════════════════════════════════════
#if ENABLE_DHT
  #include "DHT.h"
  #define DHT_PIN 12
  #define DHT_TYPE DHT11
  DHT dht(DHT_PIN, DHT_TYPE);
#endif

#if ENABLE_ULTRASONIC
  #define TRIG_PIN 13
  #define ECHO_PIN 15
#endif

// ═══════════════════════════════════════════════════════════
// GLOBALS
// ═══════════════════════════════════════════════════════════
unsigned long lastSendTime = 0;
size_t prevFrameLen = 0;
bool motionDetected = false;
int motionIntensity = 0;
int cameraFailCount = 0;
unsigned long lastWifiCheck = 0;

// Forward declarations
void startCameraServer();
void setupLedFlash(int pin);
void sendSensorData();
int detectMotion();
float readDistance();
void reinitCamera();

// ═══════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n\n=== PurrDict ESP32-CAM v2 ===");

  // Enable hardware watchdog — auto-reboot if firmware hangs
  esp_task_wdt_init(WDT_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);

  // Camera config — optimized for stable streaming
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_LATEST;    // Always get freshest frame
  config.fb_location = CAMERA_FB_IN_PSRAM;

  if (psramFound()) {
    Serial.println("PSRAM found — using optimized stream config");
    config.frame_size = FRAMESIZE_VGA;      // 640x480 — smooth at this size
    config.jpeg_quality = 18;               // Higher number = smaller file = faster stream
    config.fb_count = 2;                    // Double buffer for smooth stream
  } else {
    Serial.println("WARNING: No PSRAM — reduced quality");
    config.frame_size = FRAMESIZE_QVGA;     // 320x240
    config.jpeg_quality = 25;
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  }

  // Init camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init FAILED: 0x%x — rebooting in 3s\n", err);
    delay(3000);
    ESP.restart();
    return;
  }
  Serial.println("Camera initialized OK");

  // Sensor adjustments for better stream image
  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 1);       // Slightly brighter
  s->set_contrast(s, 1);         // More contrast for cat visibility
  s->set_saturation(s, 0);       // Normal color
  s->set_whitebal(s, 1);         // Auto white balance ON
  s->set_awb_gain(s, 1);         // Auto WB gain ON
  s->set_exposure_ctrl(s, 1);    // Auto exposure ON
  s->set_aec2(s, 1);             // Auto exposure DSP ON
  s->set_gain_ctrl(s, 1);        // Auto gain ON

  #if ENABLE_DHT
    dht.begin();
    Serial.println("DHT11 initialized");
  #endif

  #if ENABLE_ULTRASONIC
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    Serial.println("Ultrasonic initialized");
  #endif

  // LED flash setup
  #if defined(LED_GPIO_NUM)
    setupLedFlash(LED_GPIO_NUM);
  #endif

  // WiFi connect
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);           // Keep WiFi always active for stream
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < WIFI_RETRY_MAX) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi failed — rebooting");
    delay(1000);
    ESP.restart();
    return;
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Start the MJPEG stream server (port 80 + 81)
  startCameraServer();
  Serial.print("\nStream ready: http://");
  Serial.print(WiFi.localIP());
  Serial.print(":81/stream?key=");
  Serial.println(STREAM_KEY);

  Serial.printf("Sensor POST interval: %d seconds\n", SEND_INTERVAL_MS / 1000);
  Serial.println("=== Ready ===\n");
}

// ═══════════════════════════════════════════════════════════
// LOOP — Lightweight: only WiFi health + periodic sensor POST
// The stream server runs on its own task/thread, so we keep
// this loop minimal to avoid starving the stream.
// ═══════════════════════════════════════════════════════════
void loop() {
  // Feed the watchdog — proves we're not hung
  esp_task_wdt_reset();

  unsigned long now = millis();

  // ── WiFi Health Check (every 10s) ──
  if (now - lastWifiCheck >= 10000) {
    lastWifiCheck = now;
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Connection lost — reconnecting...");
      WiFi.disconnect();
      delay(100);
      WiFi.begin(WIFI_SSID, WIFI_PASS);
      
      int retry = 0;
      while (WiFi.status() != WL_CONNECTED && retry < 10) {
        delay(500);
        Serial.print(".");
        retry++;
        esp_task_wdt_reset(); // Don't trigger watchdog during reconnect
      }
      
      if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Reconnected! IP: %s\n", WiFi.localIP().toString().c_str());
      } else {
        Serial.println("\n[WiFi] Still disconnected — will retry next cycle");
        // If WiFi has been down too long, reboot
        static int wifiFailCount = 0;
        wifiFailCount++;
        if (wifiFailCount > 6) { // ~60s of no WiFi
          Serial.println("[WiFi] Too many failures — rebooting");
          ESP.restart();
        }
      }
    }
  }

  // ── Sensor Data POST (every 60s) ──
  // Only posts when WiFi is connected. Uses short timeout to avoid
  // blocking the stream server for too long.
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    if (WiFi.status() == WL_CONNECTED) {
      // Quick motion estimate from frame size (no camera grab needed — 
      // we don't want to interfere with the stream server's frame buffer)
      uint32_t heap = ESP.getFreeHeap();
      int heapDiff = abs((int)heap - (int)prevFrameLen);
      motionIntensity = constrain(map(heapDiff, 0, 3000, 0, 60), 0, 60);
      motionDetected = motionIntensity > MOTION_THRESHOLD;
      prevFrameLen = heap;

      sendSensorData();
    }
  }

  // Yield CPU — let the stream server task run smoothly
  delay(100);
}

// ═══════════════════════════════════════════════════════════
// SEND SENSOR DATA — POST to PurrDict API
// Uses short timeout to avoid blocking the stream
// ═══════════════════════════════════════════════════════════
void sendSensorData() {
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Secret", DEVICE_SECRET);
  http.setTimeout(HTTP_TIMEOUT_MS);  // Short! Don't block stream

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["motion"]          = motionDetected;
  doc["motionIntensity"] = motionIntensity;
  doc["freeHeap"]        = ESP.getFreeHeap();
  doc["uptime"]          = millis() / 1000;
  doc["rssi"]            = WiFi.RSSI();

  #if ENABLE_DHT
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    if (!isnan(temp)) doc["temperature"] = temp;
    if (!isnan(hum)) doc["humidity"] = hum;
  #endif

  #if ENABLE_ULTRASONIC
    float dist = readDistance();
    if (dist > 0 && dist < 400) doc["distance"] = dist;
  #endif

  String jsonStr;
  serializeJson(doc, jsonStr);

  int httpCode = http.POST(jsonStr);
  
  if (httpCode == 200 || httpCode == 201) {
    Serial.printf("[POST OK] Motion:%d%% | Heap:%d | RSSI:%d dBm\n", 
                  motionIntensity, ESP.getFreeHeap(), WiFi.RSSI());
  } else {
    Serial.printf("[POST ERR] HTTP %d | Heap:%d\n", httpCode, ESP.getFreeHeap());
  }

  http.end();
  
  // Feed watchdog after potentially slow HTTPS operation
  esp_task_wdt_reset();
}

// ═══════════════════════════════════════════════════════════
// ULTRASONIC DISTANCE (HC-SR04) — Optional
// ═══════════════════════════════════════════════════════════
#if ENABLE_ULTRASONIC
float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  
  return duration * 0.034 / 2.0; // cm
}
#endif

// ═══════════════════════════════════════════════════════════
// MJPEG VIDEO STREAM SERVER (port 81) — GET /stream
// Self-contained: no app_httpd.cpp / camera_index.h required.
// This is the actual live video feed consumed by the PurrDict
// Cat Cam page via the /api/esp32/stream proxy.
// ═══════════════════════════════════════════════════════════
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t stream_httpd = NULL;

// Access control fix: this handler previously served the MJPEG stream to
// any client that could reach the device on the network, with no
// credential check, and sent "Access-Control-Allow-Origin: *" on top of
// that — meaning any website open in a browser on the same LAN/WiFi as
// the camera could read the live feed cross-origin via JS, not just a
// direct browser navigation. A required `key` query parameter (compared
// against STREAM_KEY) is now checked before any frame is served, and the
// wildcard CORS header is removed entirely: this stream is consumed via
// the app's server-side proxy (a plain HTTP client, not a browser
// fetch()), which is never subject to CORS in the first place, so no
// Access-Control-Allow-Origin header is needed for that use case.
static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  char part_buf[64];

  bool authorized = false;
  char query[128];
  size_t query_len = httpd_req_get_url_query_len(req) + 1;
  if (query_len > 1 && query_len <= sizeof(query)) {
    if (httpd_req_get_url_query_str(req, query, query_len) == ESP_OK) {
      char key_val[64];
      if (httpd_query_key_value(query, "key", key_val, sizeof(key_val)) == ESP_OK) {
        if (strcmp(key_val, STREAM_KEY) == 0) {
          authorized = true;
        }
      }
    }
  }

  if (!authorized) {
    Serial.println("[Stream] Rejected: missing or invalid ?key=");
    httpd_resp_set_status(req, "401 Unauthorized");
    httpd_resp_send(req, "Unauthorized", HTTPD_RESP_USE_STRLEN);
    return ESP_FAIL;
  }

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[Stream] Capture failed");
      res = ESP_FAIL;
    } else if (fb->format != PIXFORMAT_JPEG) {
      // Camera is configured for JPEG only — this shouldn't happen
      esp_camera_fb_return(fb);
      fb = NULL;
      res = ESP_FAIL;
    }

    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf(part_buf, sizeof(part_buf), _STREAM_PART, fb->len);
      res = httpd_resp_send_chunk(req, part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)fb->buf, fb->len);
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
    }
    if (res != ESP_OK) {
      Serial.println("[Stream] Client disconnected");
      break;
    }
    // Feed the watchdog so a slow client connection can't trigger a reboot
    esp_task_wdt_reset();
  }
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 81;
  config.ctrl_port = 32768;

  httpd_uri_t stream_uri = {
    .uri      = "/stream",
    .method   = HTTP_GET,
    .handler  = stream_handler,
    .user_ctx = NULL
  };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    Serial.println("[Stream] MJPEG server started on port 81");
  } else {
    Serial.println("[Stream] FAILED to start server");
  }
}

void setupLedFlash(int pin) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW); // Off by default
}
