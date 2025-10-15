import { posthog } from "@commandkit/analytics/posthog";
import { cache } from "@commandkit/cache";
import { devtools } from "@commandkit/devtools";
import { tasks } from "@commandkit/tasks";
import { defineConfig } from "commandkit";

import dotenv from "dotenv";
dotenv.config();

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
