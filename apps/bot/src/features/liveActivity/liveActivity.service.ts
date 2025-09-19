import { WebhookClient } from "discord.js";
import { webhookUrl } from "@/config/liveActivity.config";

const sendActivity = () => {
  const webhookClient = new WebhookClient({ url: webhookUrl });
};
