-- ╔══════════════════════════════════════════════════════════╗
-- ║  DURABLE SNAPSHOT STORAGE                                 ║
-- ║  Run: psql -d purrdict -f sql/005_snapshot_storage.sql   ║
-- ╚══════════════════════════════════════════════════════════╝

-- Stores the latest camera snapshot pushed by the ESP32 (Push Mode
-- firmware, esp32/PurrDictCam_Push) directly on the device row, so it
-- survives serverless cold starts on Vercel — unlike the previous
-- in-memory-only storage in /api/esp32/snapshot.

ALTER TABLE esp32_devices ADD COLUMN IF NOT EXISTS latest_snapshot TEXT;
ALTER TABLE esp32_devices ADD COLUMN IF NOT EXISTS latest_snapshot_at TIMESTAMPTZ;
