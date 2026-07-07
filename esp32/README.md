# PurrDict ESP32-CAM Firmware

This firmware runs on the **AI-Thinker ESP32-CAM** module. There are **two firmware variants** — pick the one that matches how you're running the server:

| Variant | Sketch | Video delivery | Works with local dev? | Works with deployed (Vercel)? |
|---|---|---|---|---|
| **Push Mode** (recommended) | `PurrDictCam_Push/PurrDictCam_Push.ino` | ESP32 POSTs JPEG frames outward to `/api/esp32/snapshot`, dashboard polls for the latest one | Yes | Yes |
| **Stream Mode** (legacy) | `CameraWebServer_PurrDict/CameraWebServer_PurrDict.ino` | ESP32 hosts an MJPEG stream on port 81; the app's `/api/esp32/stream` proxy fetches it | Yes (same LAN only) | **No** — the server can't reach the ESP32's private LAN IP from the internet |

**Use Push Mode if the app is deployed to Vercel (or accessed from outside your home WiFi).** Stream Mode only works when the Next.js server and the ESP32 are on the exact same local network, since the proxy has to make an outbound HTTP request *to* the ESP32's `192.168.x.x` address — that address isn't reachable once the request originates from Vercel's servers.

Both variants also POST periodic sensor/motion data to `/api/esp32/data`, which drives the behavior detection features (walking/playing/grooming, etc).

## Hardware

- **ESP32-CAM (AI-Thinker)** with OV2640 camera
- **Optional:** DHT11 temperature sensor on GPIO 12
- **Optional:** HC-SR04 ultrasonic distance sensor (TRIG=GPIO 13, ECHO=GPIO 15)

## Setup

### 1. Install Arduino IDE Libraries

- **ArduinoJson** (by Benoit Blanchon, v6+)
- **DHT sensor library** (by Adafruit, only if using temperature sensor)
- **ESP32 Board Package** (by Espressif, v2.x+)

### 2. Configure the Firmware

**Push Mode (`PurrDictCam_Push.ino`) — recommended:**

```cpp
const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

#define USE_LOCAL_SERVER true   // true = local dev, false = deployed Vercel URL

#if USE_LOCAL_SERVER
  const char* SERVER_BASE = "http://192.168.1.100:3000"; // your PC's LAN IP
#else
  const char* SERVER_BASE = "https://your-app.vercel.app";
#endif
```

Flip `USE_LOCAL_SERVER` and re-flash whenever you switch between testing locally and pointing at the deployed site — no other code changes needed.

**Stream Mode (`CameraWebServer_PurrDict.ino`) — local network only:**

```cpp
const char* WIFI_SSID     = "YOUR_WIFI";         // Your WiFi name
const char* WIFI_PASS     = "YOUR_PASSWORD";      // Your WiFi password
const char* SERVER_URL    = "http://192.168.1.100:3000/api/esp32/data"; // PurrDict server
const char* DEVICE_ID     = "ESP32CAM";
```

**For SERVER_URL / SERVER_BASE:** Use the IP of the computer running PurrDict. Find it with:
- Windows: `ipconfig` → look for IPv4 Address
- Mac/Linux: `ifconfig` or `ip addr`

### 3. Register Device in PurrDict Database

Before the ESP32 can post data, you need a device record:

```sql
INSERT INTO esp32_devices (pin, firmware_version) 
VALUES ('ABC123', '1.0.0');
```

Then pair it in the app via the Setup page (enter the same PIN).

### 4. Flash the ESP32-CAM

1. In Arduino IDE: **Tools → Board → AI Thinker ESP32-CAM**
2. **Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)**
3. **Tools → PSRAM → Enabled**
4. Connect GPIO 0 to GND, press RST, then upload
5. Disconnect GPIO 0 from GND, press RST to run

### 5. Verify

After boot, Serial Monitor (115200 baud) shows:
```
=== PurrDict ESP32-CAM ===
Camera initialized OK
Connecting to WiFi...
WiFi connected!
IP Address: 192.168.1.42
Camera stream ready at: http://192.168.1.42:81/stream
Posting sensor data to: http://192.168.1.100:3000/api/esp32/data
Device PIN: ABC123
=== Ready ===

[OK] Motion:12% | Heap:142384 | RSSI:-45
[OK] Motion:3% | Heap:141280 | RSSI:-44
```

## How It Works

### Motion Detection

The ESP32 uses **frame size differencing** as a lightweight proxy for motion:
- JPEG compression means more visual detail = larger file size
- When the scene changes (cat moves), the JPEG frame size jumps
- The difference is mapped to a 0-100% motion intensity score

This is based on the ODBA (Overall Dynamic Body Acceleration) concept from **Ikurior et al. 2023** — more motion = higher energy expenditure.

### Behavior Classification

The PurrDict API receives the motion intensity and classifies behavior:

| Motion % | Behavior | Research Basis |
|----------|----------|---------------|
| 0-5 | Sleeping/Resting | ODBA <0.05g (Ikurior 2023) |
| 5-20 | Sitting/Alert | Minimal translational movement (Mealin 2024) |
| 20-40 | Grooming | Rhythmic low-intensity pattern (Ikurior 2023) |
| 40-60 | Walking | Moderate periodic gait (Ikurior 2023) |
| 60-80 | Playing | High erratic motion (Tattersall 2021) |
| 80-100 | Running/Zoomies | Very high sustained ODBA (Uddin 2024) |

### Data Flow

```
ESP32-CAM (every 5s)
  → Capture frame
  → Compare with previous frame (motion detection)
  → Read temp/distance sensors (if connected)
  → POST JSON to /api/esp32/data

PurrDict Server
  → Validates device PIN
  → Classifies behavior from motion intensity
  → Stores in sensor_readings + behavior_events tables
  → Dashboard polls every 10s for new data
```

## Optional Sensors

### DHT11 Temperature Sensor
- Connect VCC → 3.3V, GND → GND, DATA → GPIO 12
- Set `#define ENABLE_DHT true` in the code
- Reads temperature and humidity, shown on dashboard

### HC-SR04 Ultrasonic Distance
- Connect VCC → 5V, GND → GND, TRIG → GPIO 13, ECHO → GPIO 15
- Set `#define ENABLE_ULTRASONIC true`
- Detects cat proximity to the camera (e.g., feeding station distance)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Camera init FAILED" | Check power supply (5V/2A minimum), ensure PSRAM enabled |
| WiFi won't connect | Verify SSID/password, ensure 2.4GHz (ESP32 doesn't support 5GHz) |
| HTTP errors | Check SERVER_URL is correct, server is running, same network |
| No motion detected | Adjust `MOTION_THRESHOLD` (lower = more sensitive) |
| Stream lag | Reduce frame size or increase JPEG quality number (lower quality) |
