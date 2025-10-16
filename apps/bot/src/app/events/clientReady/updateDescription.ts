import { commandMention } from "@/features/discord/command.service";
import type { EventHandler } from "commandkit";
export const once = true;

import dotenv from "dotenv";
dotenv.config();

const handler: EventHandler<"clientReady"> = async (client) => {
  let botVersion = process.env.npm_package_version;

  if (process.env.NODE_ENV !== "production") {
    botVersion += "-" + process.env.NODE_ENV;
    client.application.edit({
      description: `\`v${botVersion}\`  ${await commandMention("hevy link")} `,
    });
  } else {
    client.application.edit({
      description: `A Hevy companion app. Share your workout now using ${await commandMention("workout latest")} or ${await commandMention("workout recent")}.

Use ${await commandMention("hevy link")} to get started !

https://chevy.fit/add-bot

(Chevy is not affiliated with Hevy) - \`v${botVersion}\`
`,
    });
  }
};

export default handler;
