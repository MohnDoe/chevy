import { posthog } from "@commandkit/analytics/posthog";
import { cache } from "@commandkit/cache";
import { devtools } from "@commandkit/devtools";
import { setDriver, tasks } from "@commandkit/tasks";
import { BullMQDriver } from "@commandkit/tasks/bullmq";
import { defineConfig, Logger } from "commandkit";

import dotenv from "dotenv";
dotenv.config();

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

export default defineConfig({
  plugins: [
    devtools(),
    posthog({
      posthogOptions: {
        apiKey: process.env.POSTHOG_API_KEY!,
        options: {
          host: process.env.POSTHOG_HOST!,
        },
      },
    }),
    cache(),
    tasks(),
  ],
});
