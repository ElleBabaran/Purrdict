/**
 * Temporal Worker — processes workflows and activities.
 *
 * Run separately from Next.js:
 *   npx ts-node src/temporal/worker.ts
 *
 * Requires a running Temporal server (e.g., temporal server start-dev).
 */

import { Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { PURRDICT_TASK_QUEUE } from "./client";

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve("./workflows"),
    activities,
    taskQueue: PURRDICT_TASK_QUEUE,
  });

  console.log("🐾 Purrdict Temporal Worker started");
  console.log(`   Task queue: ${PURRDICT_TASK_QUEUE}`);
  console.log("   Waiting for workflows...\n");

  await worker.run();
}

run().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
