import client from "@/app";
import { Logger } from "commandkit";

const getCommandId = async (name: string): Promise<string | null> => {
  if (!client.application) return null;
  if (client.application.commands.cache.size == 0) {
    Logger.info("Commands empty, fetching");
    await client.application.commands.fetch();
  }

  const commands = client.application.commands.cache;

  const correspondingCommand = commands.find((command) => command.name == name);
  if (correspondingCommand) {
    return correspondingCommand!.id;
  } else {
    return null;
  }
};

export const commandMention = async (name: string) => {
  name = name.replace("/", "");
  const fullname = name;
  name = name.split(" ")[0].trim();
  const commandId = await getCommandId(name);

  if (commandId) {
    return `</${fullname}:${commandId}>`;
  } else {
    return `\`/${fullname}\``;
  }
};
