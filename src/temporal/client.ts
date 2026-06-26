/**
 * Temporal Client — used by Next.js API routes to start workflows.
 *
 * In production, the Temporal server runs separately.
 * Set TEMPORAL_ADDRESS env var (defaults to localhost:7233).
 */

import { Client, Connection } from "@temporalio/client";

let _client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (_client) return _client;

  const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";

  const connection = await Connection.connect({ address });
  _client = new Client({ connection });

  return _client;
}

// Task queue name for all Purrdict workflows
export const PURRDICT_TASK_QUEUE = "purrdict-main";
