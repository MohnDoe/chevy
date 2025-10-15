import { setDriver } from "@commandkit/tasks";
import { BullMQDriver } from "@commandkit/tasks/bullmq";
import { Logger } from "commandkit";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds],
});

client.token = process.env.DISCORD_TOKEN!;

const bullMQHost = process.env.CHEVY_BULLMQ_REDIS_HOST;
if (!bullMQHost) {
  throw new Error("Missing environment variable: CHEVY_BULLMQ_REDIS_HOST");
}

Logger.info("Using BullMQ driver for tasks");
setDriver(
  new BullMQDriver({
    host: bullMQHost,
    port: 6379,
  }),
);
export default client;
