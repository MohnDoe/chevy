import type { EventHandler } from "commandkit";
export const once = true;

const handler: EventHandler<"clientReady"> = (client) => {
  let botVersion = process.env.npm_package_version;

  if (process.env.NODE_ENV === "development") {
    botVersion += "-dev";
    client.application.edit({
      description: `Chevy development build - \`v${botVersion}\``,
    });
  } else {
    client.application.edit({
      description: `A Hevy companion app. Use </hevy link:1417150032951377961> to get started !

Share your workout now using </workout latest:1417150032951377960> or </workout recent:1417150032951377960>.

https://chevy.doe.cool/ - \`v${botVersion}\`

(Not affiliated with Hevy.)
`,
    });
  }
};

export default handler;
