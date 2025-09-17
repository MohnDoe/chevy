import type { EventHandler } from "commandkit";
export const once = true;

const handler: EventHandler<"clientReady"> = (client) => {
  let botVersion = process.env.npm_package_version;
  if (process.env.NODE_ENV === "development") botVersion += "-dev";

  console.log(`🤖 ${client.user.displayName} v${botVersion} is online!`);
};

export default handler;
