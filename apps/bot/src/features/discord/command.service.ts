import client from "@/app";
import { Logger } from "commandkit";

const getCommandId = async (name: string): Promise<string | null> => {
  if (!client.application) return null;
  if (client.application.commands.cache.size == 0) {
    Logger.info("Commands empty, fetching");
    await client.application.commands.fetch();
  }

  let commands = client.application.commands.cache;
  commands.sweep((command) => command.name == name);
  if (commands.size > 0) {
    return commands.first()!.id;
  } else {
    return null;
  }
};

export const commandMention = async (name: string) => {
  name = name.replace("/", "");
  const fullname = name;
  name = name.split(" ")[0].trim();
  const commandId = await getCommandId(name);

  console.log(commandId);

  if (commandId) {
    return `</${fullname}:${commandId}>`;
  } else {
    return `\`/${fullname}\``;
  }
};
