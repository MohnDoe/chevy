import {
  ChatInputCommandContext,
  CommandData,
  CommandMetadata,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  bold,
  channelMention,
  Colors,
  ContainerBuilder,
  InteractionContextType,
  MessageFlags,
  subtext,
  TextDisplayBuilder,
} from "discord.js";

import {
  getUserAutoShareConfig,
  setAutoShareEnabledStatus,
} from "@/features/core/user.service";
import { getAllAutoShareActiveServers } from "@/features/autoShare/autoShare.service";
import { commandMention } from "@/features/discord/command.service";

export const metadata: CommandMetadata = {};

export const command: CommandData = {
  name: "auto-share",
  description: "Your auto-share settings on this server.",
  integration_types: [ApplicationIntegrationType.GuildInstall],
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "enable",
      description: "Enable auto-share on this server.",
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "disable",
      description: "Disable auto-share on this server.",
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "status",
      description:
        "Summary of all servers where auto-share is available to you.",
    },
  ],
};

export async function chatInput({
  interaction,
  store,
  client,
}: ChatInputCommandContext) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = store.get("user");
  const guildId = interaction.guildId!;
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "enable":
      await setAutoShareEnabledStatus(guildId, user, true);
      await interaction.followUp({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder()
            .setAccentColor(Colors.Green)
            .addTextDisplayComponents((td) =>
              td.setContent("Auto-share enabled successfuly on this server."),
            ),
          new TextDisplayBuilder().setContent(
            subtext(
              `You can disable it with ${await commandMention("auto-share disable")} any time.`,
            ),
          ),
        ],
      });
      break;
    case "disable":
      await setAutoShareEnabledStatus(guildId, user, false);
      await interaction.followUp({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder()
            .setAccentColor(Colors.Green)
            .addTextDisplayComponents((td) =>
              td.setContent("Auto-share disabled successfuly on this server."),
            ),
          new TextDisplayBuilder().setContent(
            subtext(
              `You can re-enable it with ${await commandMention("auto-share enable")} any time.`,
            ),
          ),
        ],
      });
      break;
    case "status":
      const userConfig = await getUserAutoShareConfig(guildId, user.id);
      let allAutoShareActiveServers = await getAllAutoShareActiveServers(
        user.id,
      );
      allAutoShareActiveServers = allAutoShareActiveServers.filter((server) =>
        client.guilds.cache.get(server.guildId),
      );

      let components = [];
      if (allAutoShareActiveServers.length === 0) {
        components = [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "You don't particiapte in any auto-share.",
            ),
          ),
        ];
      } else {
        components = [
          new TextDisplayBuilder().setContent(
            "Your workouts are automatically shared in the following servers:",
          ),
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              allAutoShareActiveServers
                .map((server) => {
                  let text = "- ";
                  text += client.guilds.cache.get(server.guildId)!.name;

                  if (server.guildId == guildId) {
                    text += " " + bold("(this server)");
                  }

                  text += ` in ${channelMention(server.ServerAutoShareConfig!.channelId!)}`;

                  return text;
                })
                .join("\n"),
            ),
          ),
        ];
      }
      if (!userConfig?.enabled) {
        components.push(
          new ContainerBuilder()
            .setAccentColor(Colors.Orange)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                bold("Your auto-share is NOT enabled on this server."),
              ),
              new TextDisplayBuilder().setContent(
                subtext(
                  `Activate it with ${await commandMention("auto-share enable")} any time.`,
                ),
              ),
            ),
        );
      } else {
        components.push(
          new ContainerBuilder()
            .setAccentColor(Colors.Green)
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                bold("Your auto-share is enabled on this server."),
              ),
              new TextDisplayBuilder().setContent(
                subtext(
                  `You can disable it with ${await commandMention("auto-share disable")} any time.`,
                ),
              ),
            ),
        );
      }
      await interaction.followUp({
        components,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });

      break;
  }
}
