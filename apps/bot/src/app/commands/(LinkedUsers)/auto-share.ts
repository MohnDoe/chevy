import {
  ChatInputCommandContext,
  CommandData,
  CommandMetadata,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
} from "discord.js";

import { setAutoShareEnabledStatus } from "@/features/core/user.service";
import { getServerAutoShareParticipantsCount } from "@/features/core/server.service";

export const metadata: CommandMetadata = {};

export const command: CommandData = {
  name: "auto-share",
  description: "Chevy's auto-share feature settings.",
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
}: ChatInputCommandContext) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = store.get("user");
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "enable":
      await setAutoShareEnabledStatus(interaction.guildId!, user, true);
      // TODO : add some flair and explaination here
      await interaction.followUp("Auto-share enabled on this server.");
      break;
    case "disable":
      // TODO : add some flair and explaination here
      await setAutoShareEnabledStatus(interaction.guildId!, user, false);
      await interaction.followUp("Auto-share disabled on this server.");
      break;
    case "status":
      // TODO : add some flair and explaination here
      await interaction.followUp("Auto-share status.");
      break;
  }
}
