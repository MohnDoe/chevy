import { isDiscordUserAlreadyLinked } from "@/controllers/user";
import { CommandData, UserContextMenuCommand } from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";

export const command: CommandData = {
  name: "show card",
  description: "This is an avatar command.",
  options: [
    {
      name: "user",
      description: "The user to get the avatar for.",
      type: ApplicationCommandOptionType.User,
    },
  ],
};

export const userContextMenu: UserContextMenuCommand = async ({
  interaction,
}) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (interaction.targetUser.bot) {
    await interaction.followUp({
      content: "Bot don't use Hevy, silly.",
      flags: MessageFlags.Ephemeral,
    });

    return;
  }
  const userDiscordId = interaction.targetUser.id;

  const profile = await isDiscordUserAlreadyLinked(userDiscordId);

  if (profile) {
    await interaction.followUp({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [new TextDisplayBuilder().setContent(profile.hevyUsername!)],
    });
  } else {
    await interaction.followUp({
      content: "This user does not have a Hevy profile.",
      flags: MessageFlags.Ephemeral,
    });
  }
};
