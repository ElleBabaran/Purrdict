/**
 * PurrDict ESP32-CAM Firmware — Push Mode (Camera + Sensor Data)
 *
 * Sends everything OUTWARD from the ESP32, so it works whether the
 * PurrDict server is:
 *   - running locally on your PC (npm run dev, same WiFi as the ESP32), or
 *   - deployed to Vercel (accessed from anywhere with internet)
 * ...unlike the MJPEG stream sketch (CameraWebServer_PurrDict), which
 * requires the browser/server to reach the ESP32's local IP directly —
 * impossible once the app is deployed, since the ESP32's LAN IP isn't
 * reachable from the public internet.
 *
 * This sketch does two things, both via outbound HTTP POST:
 * 1. Every ~500ms: captures a JPEG frame and POSTs it to
 *    /api/esp32/snapshot (the dashboard polls this for the live feed)
 * 2. Every DATA_SEND_INTERVAL_MS: POSTs motion/health data to
 *    /api/esp32/data (drives the behavior/motion detection features)
 *
 * Motion is estimated the same way as the stream sketch — frame size
 * differencing (more visual detail/movement = larger JPEG size).
 *
 * IMPORTANT: This sketch is self-contained. Do NOT copy app_httpd.cpp or
 * camera_index.h from the Arduino CameraWebServer example into this
 * sketch's folder — they define their own setupLedFlash()/startCameraServer()
 * and will collide with the ones below, causing a
 * "multiple definition of setupLedFlash(int)" linker error.
 *
 * Hardware: ESP32-CAM (AI-Thinker) with OV2640
 *
 * Setup:
 * 1. Change ssid / password below
 * 2. Set USE_LOCAL_SERVER to true (local dev) or false (deployed Vercel URL),
 *    and double check the matching URL in the #if block below
 * 3. Flash with board "AI Thinker ESP32-CAM", partition "Huge APP (3MB)"
 *
 * Requires the "ArduinoJson" library (by Benoit Blanchon, v6+) — same as
 * the stream sketch, see esp32/README.md.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClient.h>

// ═══════════════════════════════════════════════════════════
// CONFIGURATION — CHANGE THESE
// ═══════════════════════════════════════════════════════════
const char* ssid     = "WIFI MOTO";
const char* password = "Aronvince@123";

// Flip this before flashing depending on what you're testing against.
// true  -> local dev server (PC running `npm run dev`, same WiFi as ESP32)
// false -> deployed Vercel server (needs internet only, works anywhere)
#define USE_LOCAL_SERVER true

#if USE_LOCAL_SERVER
  // Use your PC's LAN IP (Windows: `ipconfig` -> IPv4 Address). Must match
  // the network the ESP32 connects to via `ssid` above.
  const char* SERVER_BASE = "http://192.168.1.7:3000";
#else
  const char* SERVER_BASE = "https://purrdict.vercel.app";
#endif

// Identifies this device consistently across both endpoints below so
// they attach to the same esp32_devices row instead of creating two.
const char* DEVICE_ID = "ESP32PUSH";

#define CAPTURE_INTERVAL_MS    500   // ~2 FPS frame push
#define DATA_SEND_INTERVAL_MS  5000  // motion/health data every 5s
#define HTTP_TIMEOUT_MS        1500  // fail fast on a bad connection instead
                                      // of freezing the capture loop for 3s
#define MOTION_THRESHOLD       15    // frame-size-diff threshold (informational)

// Optional sensors — same wiring as the stream sketch, disabled by default.
#define ENABLE_DHT        false   // DHT11 on GPIO 12
#define ENABLE_ULTRASONIC false   // HC-SR04: TRIG=GPIO 13, ECHO=GPIO 15

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
// AI-THINKER PIN MAP
// ═══════════════════════════════════════════════════════════
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define LED_GPIO_NUM       4

void setupLedFlash(int pin) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

// ═══════════════════════════════════════════════════════════
// GLOBALS
// ═══════════════════════════════════════════════════════════
unsigned long lastDataSendTime = 0;
size_t prevFrameLen = 0;
int motionIntensity = 0;
bool motionDetected = false;

// Reused across loop() iterations so HTTPClient can keep the underlying
// TCP connection to the server open between frame pushes instead of
// reconnecting (and re-doing the TCP/TLS handshake) every ~500ms.
WiFiClient snapshotClient;

float readDistance();
void sendSensorData();

// ═══════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== PurrDict-Cam (Push Mode) ===");
  Serial.printf("Server: %s\n", SERVER_BASE);

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
  config.frame_size   = FRAMESIZE_QVGA;
  config.jpeg_quality = 15;
  config.fb_count     = 1;
  config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location  = CAMERA_FB_IN_PSRAM;

  if (!psramFound()) {
    config.fb_location = CAMERA_FB_IN_DRAM;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera FAILED: 0x%x\n", err);
    return;
  }
  Serial.println("Camera: OK");

  sensor_t *s = esp_camera_sensor_get();
  s->set_brightness(s, 1);
  s->set_whitebal(s, 1);
  s->set_exposure_ctrl(s, 1);
  s->set_gain_ctrl(s, 1);

  setupLedFlash(LED_GPIO_NUM);

  #if ENABLE_DHT
    dht.begin();
    Serial.println("DHT11 initialized");
  #endif

  #if ENABLE_ULTRASONIC
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    Serial.println("Ultrasonic initialized");
  #endif

  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Pushing frames to: %s/api/esp32/snapshot\n", SERVER_BASE);
  Serial.printf("Pushing sensor data to: %s/api/esp32/data every %ds\n", SERVER_BASE, DATA_SEND_INTERVAL_MS / 1000);
  Serial.println("════════════════════════════════");
}

// ═══════════════════════════════════════════════════════════
// LOOP
// ═══════════════════════════════════════════════════════════
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(5000);
    return;
  }

  // Capture a frame
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    delay(1000);
    return;
  }

  // Frame-size differencing: bigger jump in JPEG size ≈ more motion in
  // the scene (matches the approach documented in esp32/README.md).
  size_t diff = (prevFrameLen == 0) ? 0 : (size_t)abs((long)fb->len - (long)prevFrameLen);
  motionIntensity = constrain(map(diff, 0, 4000, 0, 100), 0, 100);
  motionDetected = motionIntensity > MOTION_THRESHOLD;
  prevFrameLen = fb->len;

  // POST the JPEG to PurrDict server. Reuses `snapshotClient` (a single
  // WiFiClient kept alive across loop() iterations) so HTTPClient can
  // keep the underlying TCP connection open between frames instead of
  // reconnecting from scratch every ~500ms.
  {
    HTTPClient http;
    String snapshotUrl = String(SERVER_BASE) + "/api/esp32/snapshot?deviceId=" + DEVICE_ID;
    http.begin(snapshotClient, snapshotUrl);
    http.addHeader("Content-Type", "image/jpeg");
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.setReuse(true);

    unsigned long t0 = millis();
    int code = http.POST(fb->buf, fb->len);
    unsigned long elapsed = millis() - t0;
    if (code == 200) {
      Serial.printf("[OK] Frame sent: %d bytes | Motion:%d%% | %lums\n", fb->len, motionIntensity, elapsed);
    } else {
      Serial.printf("[ERR] Snapshot HTTP %d (%lums)\n", code, elapsed);
    }
    http.end();
  }

  esp_camera_fb_return(fb);

  // Periodically POST motion/health data (drives behavior detection)
  unsigned long now = millis();
  if (now - lastDataSendTime >= DATA_SEND_INTERVAL_MS) {
    lastDataSendTime = now;
    sendSensorData();
  }

  // Only pad the loop if the POST itself finished quickly — if the
  // network is already slow, don't add artificial delay on top of it.
  delay(CAPTURE_INTERVAL_MS);
}

// ═══════════════════════════════════════════════════════════
// SEND SENSOR DATA — POST to /api/esp32/data
// ═══════════════════════════════════════════════════════════
void sendSensorData() {
  HTTPClient http;
  String dataUrl = String(SERVER_BASE) + "/api/esp32/data";
  http.begin(dataUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT_MS);

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
    Serial.printf("[DATA OK] Motion:%d%% | Heap:%d | RSSI:%d dBm\n",
                  motionIntensity, ESP.getFreeHeap(), WiFi.RSSI());
  } else {
    Serial.printf("[DATA ERR] HTTP %d\n", httpCode);
  }
  http.end();
}

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
