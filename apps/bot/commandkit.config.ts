import { defineConfig } from "commandkit";
import { devtools } from "@commandkit/devtools";
import { posthog } from "@commandkit/analytics/posthog";
import { BeforeSendFn, EventMessage } from "posthog-node";

export default defineConfig({
  plugins: [
    ...(process.env.NODE_ENV === "development" ? [devtools()] : []),
    posthog({
      posthogOptions: {
        apiKey: process.env.POSTHOG_API_KEY!,
      },
    }),
  ],
});
