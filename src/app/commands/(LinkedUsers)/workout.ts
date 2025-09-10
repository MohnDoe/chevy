import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import { getUserLatestWorkout } from "../../../hevy/botApi";
import { embedWorkout } from "../../../hevy/utils/embedder";
import {
  ButtonKit,
  ChatInputCommandContext,
  CommandMetadata,
  OnButtonKitClick,
} from "commandkit";
import { getUserByDiscordId } from "../../../controllers/user";
import { HevyWorkout } from "../../../types/hevy/workout.type";

export const command = new SlashCommandBuilder()
  .setName("workout")
  .setDescription("Share one of your workouts on this channel now")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.UseApplicationCommands
  )
  .setContexts([
    InteractionContextType.BotDM,
    InteractionContextType.Guild,
    InteractionContextType.PrivateChannel,
  ])
  .addSubcommand((sc) =>
    sc.setName("latest").setDescription("Share your last finished workout.")
  )
  .addSubcommand((sc) =>
    sc
      .setName("list")
      .setDescription("Select one from a list of recent workouts.")
  );

let workout: HevyWorkout | null;

export async function chatInput({
  interaction,
  client,
}: ChatInputCommandContext) {
  await interaction.deferReply({
    withResponse: true,
    flags: MessageFlags.Ephemeral,
  });
  const user = await getUserByDiscordId(interaction.user.id);

  workout = await getUserLatestWorkout(user!.hevyUsername!);

  if (workout) {
    const embed = embedWorkout(workout);

    await interaction.followUp({
      flags: MessageFlags.Ephemeral,
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents([
          new ButtonKit()
            .setLabel("Send in chat")
            .setCustomId("sendInChat")
            .setStyle(ButtonStyle.Primary)
            .onClick(handleMessageClick),
        ]),
      ],
    });
  } else {
    await interaction.reply({
      content: "No latest workout found.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

const handleMessageClick: OnButtonKitClick = async (
  interaction: ButtonInteraction,
  context: ButtonKit
) => {
  switch (interaction.customId) {
    case "sendInChat":
      await interaction.deferReply({ withResponse: true });
      await interaction.followUp({
        embeds: [embedWorkout(workout!)],
      });
      break;

    default:
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: `Unhandle interaction  ${interaction.customId}`,
      });
      break;
  }
};

export const metadata: CommandMetadata = {};
