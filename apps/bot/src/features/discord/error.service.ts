import {
  Colors,
  ContainerBuilder,
  DiscordAPIError,
  MessageComponentInteraction,
  MessageFlags,
  subtext,
  TextDisplayBuilder,
} from "discord.js";

export const handleDiscordAPIError = async (
  error: DiscordAPIError,
  interaction: MessageComponentInteraction,
) => {
  if (!interaction.deferred) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });
  }
  if (error.code == 50001) {
    await interaction.followUp({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder()
          .setAccentColor(Colors.Red)
          .addTextDisplayComponents([
            new TextDisplayBuilder().setContent(
              "### ⚠ I do not have the permission to send messages here.",
            ),
            new TextDisplayBuilder().setContent(
              subtext(
                "Ask the admin to either add Chevy in this channel or give Chevy the permission to send messages here.",
              ),
            ),
          ]),
      ],
    });
  } else {
    await interaction.followUp({
      flags: MessageFlags.Ephemeral,
      content: "Something went wrong, please try again later.",
    });
  }
};
