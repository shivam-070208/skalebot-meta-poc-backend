import "dotenv/config";
import { startAutomationWorker } from "@/workers/automation.worker";
import { startCampaignWorker } from "@/workers/campaign.worker";
import { startMessageWorker } from "@/workers/message.worker";
import { startPublishWorker } from "@/workers/publish.worker";

const publishWorker = startPublishWorker();
const messageWorker = startMessageWorker();
const automationWorker = startAutomationWorker();
const campaignWorker = startCampaignWorker();

console.log("BullMQ workers started (publish, message, automation, campaign)");

const shutdown = async (): Promise<void> => {
  await Promise.all([
    publishWorker.close(),
    messageWorker.close(),
    automationWorker.close(),
    campaignWorker.close(),
  ]);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
