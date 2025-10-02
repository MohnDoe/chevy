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

import { getUserAutoShareConfig, setAutoShareEnabledStatus } from "@/features/core/user.service";

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
}: ChatInputCommandContext) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = store.get("user");
  const guildId = interaction.guildId!;
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "enable":
      await setAutoShareEnabledStatus(guildId, user, true);
      // TODO : add some flair and explaination here
      await interaction.followUp("Auto-share enabled on this server.");
      break;
    case "disable":
      // TODO : add some flair and explaination here
      await setAutoShareEnabledStatus(guildId, user, false);
      await interaction.followUp("Auto-share disabled on this server.");
      break;
    case "status":
      const userConfig = await getUserAutoShareConfig(guildId, user.id);

      // TODO : add some flair and explaination here
      if (userConfig?.enabled)
        await interaction.followUp("Auto-share is enabled on this server.");
      else
        await interaction.followUp("Auto-share is disabled on this server.");
      break;
  }
}
