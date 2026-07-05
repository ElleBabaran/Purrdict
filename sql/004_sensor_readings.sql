-- ╔══════════════════════════════════════════════════════════╗
-- ║  SENSOR READINGS — Raw ESP32 data ingestion table       ║
-- ║  Run: psql -d purrdict -f sql/004_sensor_readings.sql   ║
-- ╚══════════════════════════════════════════════════════════╝

-- This table stores raw sensor readings from the ESP32 device
-- at high frequency (every 5-10 seconds). Used for:
-- - Motion detection timeline
-- - Temperature/humidity history
-- - Distance sensor readings
-- - Device health monitoring (heap, RSSI, uptime)

CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES esp32_devices(id) ON DELETE CASCADE,
  cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
  
  -- Motion detection (from ESP32-CAM frame differencing)
  motion BOOLEAN NOT NULL DEFAULT false,
  motion_intensity INT NOT NULL DEFAULT 0 CHECK (motion_intensity BETWEEN 0 AND 100),
  
  -- Optional sensors
  distance_cm REAL,           -- Ultrasonic sensor (HC-SR04)
  temperature_c REAL,         -- DHT11/DHT22/DS18B20
  humidity_pct REAL,          -- DHT11/DHT22
  
  -- Device health
  free_heap INT,              -- ESP32 free heap in bytes
  uptime_secs INT,            -- Seconds since boot
  rssi INT,                   -- WiFi signal strength (dBm)
  
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient dashboard queries
CREATE INDEX IF NOT EXISTS idx_sensor_device_time ON sensor_readings(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_cat_time ON sensor_readings(cat_id, recorded_at DESC);

-- Cleanup: auto-delete readings older than 7 days (optional, run as cron)
-- DELETE FROM sensor_readings WHERE recorded_at < now() - INTERVAL '7 days';
