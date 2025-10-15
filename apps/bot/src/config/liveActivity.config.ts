const webhookUrl = process.env.CHEVY_LIVE_ACTIVITY_WEBHOOK_URL;
if (!webhookUrl) {
  throw new Error(
    "Missing environment variable: CHEVY_LIVE_ACTIVITY_WEBHOOK_URL"
  );
}

export default {
  webhookUrl,
};
