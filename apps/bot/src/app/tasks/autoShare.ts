import { task } from "@commandkit/tasks";
import { Logger } from "commandkit";

export default task({
  name: "auto-share-workouts",
  schedule: "*/30 * * * *",
  async execute(ctx) {
    Logger.info("Task executed!");
    // Access the Discord.js client
    const client = ctx.commandkit.client;

    // Send a message to a channel
    const channel = client.channels.cache.get("1419972812453707856");
    if (channel?.isSendable()) {
      await channel.send("Task executed!");
    }
  },
});
