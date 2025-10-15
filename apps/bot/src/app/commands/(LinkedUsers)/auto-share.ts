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
  Colors,
  ContainerBuilder,
  InteractionContextType,
  MessageFlags,
  subtext,
  TextDisplayBuilder,
} from "discord.js";

import { listServers } from "@/features/autoShare/autoShare.embeds";
import { getAllAutoShareActiveServers } from "@/features/autoShare/autoShare.service";
import {
  getUserAutoShareConfig,
  setAutoShareEnabledStatus,
  setAutoShareEnabledStatusInAllServers,
} from "@/features/core/user.service";
import { commandMention } from "@/features/discord/command.service";
import { UserWithHevyVerification } from "@/features/hevy/hevy.service";

export const metadata: CommandMetadata = {};

export const command: CommandData = {
  name: "auto-share",
  description: "Your auto-share settings on this server.",
  integration_types: [ApplicationIntegrationType.GuildInstall],
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  options: [
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: "enable",
      description: "Enable auto-share.",
      options: [
        {
          name: "here",
          description: "Enable auto-share on this server !",
          type: ApplicationCommandOptionType.Subcommand,
        },
        // {
        //   name: "all",
        //   description: "Enable auto-share on all servers you are on !",
        //   type: ApplicationCommandOptionType.Subcommand,
        // },
      ],
    },
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: "disable",
      description: "Disable auto-share.",
      options: [
        {
          name: "here",
          description: "Disable auto-share on this server !",
          type: ApplicationCommandOptionType.Subcommand,
        },
        // {
        //   name: "all",
        //   description: "Disable auto-share on all servers you are on !",
        //   type: ApplicationCommandOptionType.Subcommand,
        // },
      ],
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

  const user = store.get(
    "userWithHevyVerification",
  ) as UserWithHevyVerification;
  const guildId = interaction.guildId!;
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  let allAutoShareActiveServers = await getAllAutoShareActiveServers(user.id);
  // filter out servers the bot is not in anymore
  allAutoShareActiveServers = allAutoShareActiveServers.filter((server) =>
    client.guilds.cache.get(server.guildId),
  );

  if (subcommandGroup) {
    const enabled = subcommandGroup == "enable";
    switch (subcommand) {
      case "here": {
        await setAutoShareEnabledStatus(guildId, user, enabled);

        const newStatusText = enabled
          ? "Auto-share enabled successfuly on this server."
          : "Auto-share disabled successfuly on this server.";
        const toggleText = enabled
          ? `You can disable it with ${await commandMention("auto-share disable here")} any time.`
          : `You can re-enable it with ${await commandMention("auto-share enable here")} any time.`;

        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(Colors.Green)
              .addTextDisplayComponents((td) => td.setContent(newStatusText)),
            new TextDisplayBuilder().setContent(subtext(toggleText)),
            listServers(allAutoShareActiveServers, guildId),
          ],
        });
        break;
      }
      case "all": {
        await setAutoShareEnabledStatusInAllServers(user, enabled, guildId);

        const newStatusText = enabled
          ? "Auto-share was enabled on all available servers."
          : "Auto-share was disabled on all availabled servers.";

        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(Colors.Green)
              .addTextDisplayComponents((td) => td.setContent(newStatusText)),
            listServers(allAutoShareActiveServers, guildId),
          ],
        });

        break;
      }
    }
  } else {
    switch (subcommand) {
      case "status":
        const userConfig = await getUserAutoShareConfig(guildId, user.id);

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
            listServers(allAutoShareActiveServers, interaction.guildId),
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
                    `Activate it with ${await commandMention("auto-share enable here")} any time.`,
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
                    `You can disable it with ${await commandMention("auto-share disable here")} any time.`,
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
}
