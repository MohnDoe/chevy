import {
  ChatInputCommandContext,
  CommandData,
  CommandMetadata,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  MessageFlags,
} from "discord.js";

export const metadata: CommandMetadata = {};

export const command: CommandData = {
  name: "auto-share",
  description: "Chevy's auto-share feature settings.",
  integration_types: [ApplicationIntegrationType.GuildInstall],
  type: ApplicationCommandType.ChatInput,
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

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "enable":
      await interaction.reply("Auto-share enabled.");
      break;
    case "disable":
      await interaction.reply("Auto-share disabled.");
      break;
    case "status":
      await interaction.reply("Auto-share status.");
      break;
  }
}
