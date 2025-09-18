import type { EventHandler } from "commandkit";
import { track } from "commandkit/analytics";

const handler: EventHandler<"guildCreate"> = (client) => {
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
