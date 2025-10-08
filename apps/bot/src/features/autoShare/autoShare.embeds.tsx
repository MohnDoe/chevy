import client from "@/app";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  bold,
  channelMention,
} from "discord.js";
import { ServerWithAutoShareConfig } from "./autoShare.types";

export const listServers = (
  servers: ServerWithAutoShareConfig[],
  currentServerId: string | null,
) => {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### Servers where your workouts are auto-shared :`,
    ),
    new TextDisplayBuilder().setContent(
      servers.length == 0
        ? "None!"
        : servers
            .map((server) => {
              let text = "- ";
              text += client.guilds.cache.get(server.guildId)!.name;

              if (currentServerId && server.guildId == currentServerId) {
                text += " " + bold("(this server)");
              }

              text += ` in ${channelMention(server.ServerAutoShareConfig!.channelId!)}`;

              return text;
            })
            .join("\n"),
    ),
  );
};
