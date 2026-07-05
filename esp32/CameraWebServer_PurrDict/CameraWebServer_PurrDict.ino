/**
 * PurrDict ESP32-CAM Firmware
 * 
 * Based on the CameraWebServer example, extended to:
 * 1. Stream MJPEG video (port 81) — for the Cat Cam page
 * 2. POST sensor data to the PurrDict API every 5 seconds:
 *    - Motion detection (camera frame differencing)
 *    - Temperature (DHT11 on GPIO 12, optional)
 *    - Distance (HC-SR04 ultrasonic, optional)
 *    - Device health (free heap, RSSI, uptime)
 * 
 * Hardware:
 * - ESP32-CAM (AI-Thinker) with OV2640
 * - Optional: DHT11 on GPIO 12
 * - Optional: HC-SR04 (TRIG=GPIO 13, ECHO=GPIO 15) — only if not using SD card
 * 
 * Setup:
 * 1. Change WIFI_SSID and WIFI_PASS
 * 2. Change SERVER_URL to your PurrDict server IP/domain
 * 3. Change DEVICE_PIN to the 6-char PIN registered in the app
 * 4. Flash with "AI Thinker ESP32-CAM" board, partition "Huge APP (3MB)"
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ═══════════════════════════════════════════════════════════
// CONFIGURATION — CHANGE THESE
// ═══════════════════════════════════════════════════════════
const char* WIFI_SSID     = "WIFI MOTO";
const char* WIFI_PASS     = "Aronvince@123";
const char* SERVER_URL    = "https://purrdict.vercel.app/api/esp32/data"; // PurrDict Vercel server
const char* DEVICE_ID     = "ESP32CAM";  // Any identifier for this device

// Sensor config
#define ENABLE_DHT        false   // Set true if DHT11 connected to GPIO 12
#define ENABLE_ULTRASONIC false   // Set true if HC-SR04 connected
#define SEND_INTERVAL_MS  5000    // Send data every 5 seconds
#define MOTION_THRESHOLD  15      // Pixel diff threshold for motion detection

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
uint8_t* prevFrame = NULL;
size_t prevFrameLen = 0;
bool motionDetected = false;
int motionIntensity = 0;

// Forward declarations
void startCameraServer();
void setupLedFlash(int pin);
void sendSensorData();
int detectMotion(camera_fb_t* fb);
float readDistance();

// ═══════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n\n=== PurrDict ESP32-CAM ===");

  // Camera config
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
  config.frame_size = FRAMESIZE_QVGA; // 320x240 — good for motion detection
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 2;

  if (psramFound()) {
    config.jpeg_quality = 10;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.fb_location = CAMERA_FB_IN_DRAM;
  }

  // Init camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init FAILED: 0x%x\n", err);
    return;
  }
  Serial.println("Camera initialized OK");

  // Sensor setup
  sensor_t* s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  s->set_framesize(s, FRAMESIZE_QVGA);

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
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  WiFi.setSleep(false);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Start the MJPEG stream server (port 80 + 81)
  startCameraServer();
  Serial.print("Camera stream ready at: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream");

  Serial.printf("Posting sensor data to: %s\n", SERVER_URL);
  Serial.printf("Device ID: %s\n", DEVICE_ID);
  Serial.printf("Send interval: %d ms\n", SEND_INTERVAL_MS);
  Serial.println("=== Ready ===\n");
}

// ═══════════════════════════════════════════════════════════
// LOOP — Motion detection + sensor posting
// ═══════════════════════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // Every SEND_INTERVAL_MS: capture frame, detect motion, post data
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // Capture frame for motion detection
    camera_fb_t* fb = esp_camera_fb_get();
    if (fb) {
      motionIntensity = detectMotion(fb);
      motionDetected = motionIntensity > MOTION_THRESHOLD;
      esp_camera_fb_return(fb);
    }

    // Send data to server
    if (WiFi.status() == WL_CONNECTED) {
      sendSensorData();
    } else {
      Serial.println("WiFi disconnected! Reconnecting...");
      WiFi.reconnect();
    }
  }

  delay(10); // yield
}

// ═══════════════════════════════════════════════════════════
// MOTION DETECTION — Simple frame differencing
// Compares current JPEG frame size with previous one.
// Large size changes indicate motion (more detail = more bytes).
// Research basis: Ikurior 2023 — ODBA proxy via visual motion
// ═══════════════════════════════════════════════════════════
int detectMotion(camera_fb_t* fb) {
  if (prevFrame == NULL) {
    // First frame — store and return 0
    prevFrameLen = fb->len;
    prevFrame = (uint8_t*)malloc(sizeof(size_t));
    if (prevFrame) {
      memcpy(prevFrame, &fb->len, sizeof(size_t));
    }
    return 0;
  }

  // Compare frame sizes — JPEG compression means more detail = bigger file
  // This is a lightweight proxy for actual pixel differencing
  size_t oldLen = 0;
  memcpy(&oldLen, prevFrame, sizeof(size_t));
  
  int diff = abs((int)fb->len - (int)oldLen);
  int intensity = map(diff, 0, 5000, 0, 100); // 0-5000 byte diff maps to 0-100%
  intensity = constrain(intensity, 0, 100);

  // Update stored frame size
  memcpy(prevFrame, &fb->len, sizeof(size_t));

  return intensity;
}

// ═══════════════════════════════════════════════════════════
// SEND SENSOR DATA — POST to PurrDict API
// ═══════════════════════════════════════════════════════════
void sendSensorData() {
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["motion"] = motionDetected;
  doc["motionIntensity"] = motionIntensity;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"] = millis() / 1000;
  doc["rssi"] = WiFi.RSSI();

  // Optional: Temperature & Humidity
  #if ENABLE_DHT
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    if (!isnan(temp)) doc["temperature"] = temp;
    if (!isnan(hum)) doc["humidity"] = hum;
  #endif

  // Optional: Distance
  #if ENABLE_ULTRASONIC
    float dist = readDistance();
    if (dist > 0 && dist < 400) doc["distance"] = dist;
  #endif

  String jsonStr;
  serializeJson(doc, jsonStr);

  int httpCode = http.POST(jsonStr);
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.printf("[OK] Motion:%d%% | Heap:%d | RSSI:%d\n", 
                  motionIntensity, ESP.getFreeHeap(), WiFi.RSSI());
  } else {
    Serial.printf("[ERR] HTTP %d: %s\n", httpCode, http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ═══════════════════════════════════════════════════════════
// ULTRASONIC DISTANCE (HC-SR04)
// ═══════════════════════════════════════════════════════════
#if ENABLE_ULTRASONIC
float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return -1;
  
  float distance = duration * 0.034 / 2.0; // cm
  return distance;
}
#endif
