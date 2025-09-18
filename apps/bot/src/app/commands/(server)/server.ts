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
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";

export const metadata: CommandMetadata = {
  userPermissions: ["ManageGuild"],
};

export const command: CommandData = {
  name: "server",
  description: "Set-up Chevy on this server.",
  contexts: [InteractionContextType.Guild],
  integration_types: [ApplicationIntegrationType.GuildInstall],
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "set",
      description: "Set-up Chevy!",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "auto-share",
          description: "Chevy's auto-share feature settings.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "active",
              description:
                "Should auto-share be active and sending new workouts?",
              type: ApplicationCommandOptionType.Boolean,
              required: true,
            },
            {
              name: "channel",
              description: "Destination channel",
              type: ApplicationCommandOptionType.Channel,
              required: true,
            },
            {
              name: "mode",
              description: "Choose a frequency",
              type: ApplicationCommandOptionType.String,
              choices: [
                { name: "Real-time", value: "real-time" },
                { name: "Daily", value: "daily" },
                { name: "Weekly", value: "real-time" },
              ],
              required: true,
            },
            {
              name: "format",
              description: "What does the message look like?",
              type: ApplicationCommandOptionType.String,
              choices: [
                { name: "Just a line", value: "real-time" },
                { name: "Some details", value: "daily" },
                { name: "Weekly", value: "real-time" },
              ],
              required: true,
            },
            {
              name: "mention",
              description:
                "Who should Chevy ping when sharing? (Leave empty to disable)",
              type: ApplicationCommandOptionType.Role,
            },
          ],
        },
      ],
    },
  ],
};

export async function chatInput({
  interaction,
  store,
}: ChatInputCommandContext) {}
