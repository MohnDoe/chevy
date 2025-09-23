import { defineConfig, Logger, COMMANDKIT_IS_DEV } from "commandkit";

import { devtools } from "@commandkit/devtools";

import { posthog } from "@commandkit/analytics/posthog";

import { setDriver, tasks } from "@commandkit/tasks";
import { SQLiteDriver } from "@commandkit/tasks/sqlite";
import { BullMQDriver } from "@commandkit/tasks/bullmq";

import dotenv from "dotenv";
dotenv.config();

Logger.debug(process.env.NODE_ENV);

if (process.env.NODE_ENV === "development") {
  Logger.info("Using SQLite driver for tasks");
  setDriver(new SQLiteDriver("./tasks.db"));
} else {
  Logger.info("Using BullMQ driver for tasks");
  setDriver(
    new BullMQDriver({
      host: "localhost",
      port: 6379,
    })
  );
}

export default defineConfig({
  plugins: [
    ...(process.env.NODE_ENV === "development" ? [devtools()] : []),
    posthog({
      posthogOptions: {
        apiKey: process.env.POSTHOG_API_KEY!,
        options: {
          host: process.env.POSTHOG_HOST!,
        },
      },
    }),
    tasks(),
  ],
});
