import fs from "node:fs";
import { Pool } from "@neondatabase/serverless";

const env = fs.readFileSync(".env.local", "utf-8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const pool = new Pool({ connectionString: url });

const res = await pool.query(
  "SELECT id, pin, firmware_version, length(latest_snapshot) as snap_len, latest_snapshot_at FROM esp32_devices WHERE latest_snapshot IS NOT NULL ORDER BY latest_snapshot_at DESC LIMIT 3"
);
console.log(JSON.stringify(res.rows, null, 2));
await pool.end();
