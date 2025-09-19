import { sendActivity } from "@/features/liveActivity/liveActivity.service";
import type { EventHandler } from "commandkit";
import { track } from "commandkit/analytics";

const handler: EventHandler<"guildCreate"> = (client) => {
  sendActivity(`Chevy was **removed from a server**.`);
  track({
    name: "server deleted",
    data: {
      memberCount: client.memberCount,
      name: client.name,
      serverId: client.id,
      verified: client.verified,
    },
  });
};

export default handler;
