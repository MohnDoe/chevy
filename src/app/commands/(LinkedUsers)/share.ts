import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { getUserLatestWorkout } from "../../../hevy/api";
import { embedWorkout } from "../../../hevy/utils/embedder";
import { ChatInputCommandContext, CommandMetadata } from "commandkit";

export const command = new SlashCommandBuilder()
  .setName("share")
  .setDescription("Share one of your workouts on this channel now")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
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

export async function chatInput({
  interaction,
  client,
}: ChatInputCommandContext) {
  const workout = await getUserLatestWorkout("mohndoe");

  if (workout) {
    const embeds = [embedWorkout(workout)];

    await interaction.reply({
      content: `<@${interaction.user.id}> latest workout.`,
      embeds,
    });
  } else {
    await interaction.reply({
      content: "No latest workout found.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

export const metadata: CommandMetadata = {};
