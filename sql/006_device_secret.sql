-- ╔══════════════════════════════════════════════════════════╗
-- ║  DEVICE SECRET — per-device shared secret for ingestion  ║
-- ║  Run: psql -d purrdict -f sql/006_device_secret.sql      ║
-- ╚══════════════════════════════════════════════════════════╝
--
-- Closes an Improper Access Control / Missing Authentication gap:
-- POST /api/esp32/data and POST /api/esp32/snapshot previously accepted
-- data from anyone with no credential at all, and would silently
-- auto-register a brand-new device (and link it to "the first cat in the
-- system") whenever no deviceId matched. That meant:
--   1. Anyone could POST fabricated sensor/behavior data for any cat.
--   2. Anyone could overwrite the live camera snapshot anyone else's
--      dashboard was viewing.
--   3. In a multi-tenant deployment, an unauthenticated POST could get
--      auto-linked to a cat belonging to a user who never registered
--      that device.
--
-- Fix: every device now gets a random secret at pairing time
-- (POST /api/esp32/pair). Devices must present it via the
-- `X-Device-Secret` header on every POST to /api/esp32/data and
-- /api/esp32/snapshot. There is no more "auto-create a device on first
-- POST" path — a device must be explicitly paired first.

ALTER TABLE esp32_devices ADD COLUMN IF NOT EXISTS device_secret TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_secret ON esp32_devices(device_secret) WHERE device_secret IS NOT NULL;
