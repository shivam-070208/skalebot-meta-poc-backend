import "dotenv/config";
import { startAutomationWorker } from "@/workers/automation.worker.js";
import { startMessageWorker } from "@/workers/message.worker.js";
import { startPublishWorker } from "@/workers/publish.worker.js";

const publishWorker = startPublishWorker();
const messageWorker = startMessageWorker();
const automationWorker = startAutomationWorker();

console.log("BullMQ workers started (publish, message, automation)");

const shutdown = async (): Promise<void> => {
  await Promise.all([
    publishWorker.close(),
    messageWorker.close(),
    automationWorker.close(),
  ]);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
