import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageFlags,
  StringSelectMenuInteraction,
} from "discord.js";

import { HevyWorkout } from "@/types/hevy/botApi/workout.type";
import { sharabledWorkoutEphemeralOptions } from "./parsers";
import { WorkoutComponentFormat } from "@/controllers/hevy/utils/workoutParser";

export async function followUpWithWorkoutEphemeral(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction,
  workout: HevyWorkout | null
) {
  if (workout) {
    await interaction.followUp(
      sharabledWorkoutEphemeralOptions(
        workout,
        "standard"
      ) as InteractionReplyOptions
    );
  } else {
    await interaction.reply({
      content: "No workout found !",
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function changeWorkoutFormat(
  interaction: ButtonInteraction,
  workout: HevyWorkout,
  format: WorkoutComponentFormat
) {
  console.log(
    `Changing workout#${workout.short_id} format to ${format} | ${interaction.id}`
  );
  if (!interaction.deferred) await interaction.deferUpdate();
  await interaction.editReply(
    sharabledWorkoutEphemeralOptions(
      workout,
      format
    ) as InteractionEditReplyOptions
  );
}
