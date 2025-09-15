import { isDiscordUserAlreadyLinked } from "@/controllers/user";
import {
  CommandData,
  CommandMetadata,
  UserContextMenuCommand,
} from "commandkit";
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
  name: "show-user-hevy-profile",
};

export const metadata: CommandMetadata = {
  nameAliases: {
    user: "Show Hevy card",
    message: "View user's Hevy card",
  },
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
