import { upsertServer } from "@/features/core/server.service";
import type { EventHandler } from "commandkit";

const handler: EventHandler<"guildCreate"> = async (client) => {
  await upsertServer(client.id);
};

export default handler;
