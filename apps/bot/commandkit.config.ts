import { defineConfig } from "commandkit";
import { devtools } from "@commandkit/devtools";
import { umami } from "@commandkit/analytics/umami";

export default defineConfig({
  plugins: [
    ...(process.env.NODE_ENV === "development" ? [devtools()] : []),
    umami({
      umamiOptions: {
        hostUrl: process.env.UMAMI_HOST_URL,
        websiteId: process.env.UMAMI_WEBSITE_ID,
      },
    }),
  ],
});
