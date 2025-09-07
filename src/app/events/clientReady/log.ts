import type { EventHandler } from "commandkit";

export const once = true;

const handler: EventHandler<"clientReady"> = (client) => {
  console.log(`🤖 ${client.user.displayName} is online!`);
};

export default handler;
