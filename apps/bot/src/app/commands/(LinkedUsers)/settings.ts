import {
  ChatInputCommandContext,
  Command,
  CommandData,
  CommandMetadata,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
} from "discord.js";

export const metadata: CommandMetadata = {};

export const command: CommandData = {
  name: "settings",

  description: "Your Chevy settings here.",
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "auto-share",
      description: "Chevy's auto-share feature settings.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "active",
          description:
            "Should Chevy share your new workout once they are completed?",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        },
      ],
    },
  ],
};

export async function chatInput({
  interaction,
  store,
}: ChatInputCommandContext) {}
