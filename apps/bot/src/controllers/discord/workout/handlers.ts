import {
  ButtonKit,
  OnStringSelectMenuKitSubmit,
  StringSelectMenuKit,
} from "commandkit";

import {
  ButtonInteraction,
  InteractionEditReplyOptions,
  MessageFlags,
  StringSelectMenuInteraction,
} from "discord.js";

import { sharabledWorkoutEphemeralOptions } from "./parsers";
import {
  toComponent,
  WorkoutComponentFormat,
} from "@/controllers/hevy/utils/workoutParser";
import { HevyWorkout } from "@/types/hevy/botApi/workout.type";
import { changeWorkoutFormat } from "./interactions";
import { getWorkout } from "@/controllers/hevy/botApi";

export const handleSelectWorkout = async (
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  context: ButtonKit | StringSelectMenuKit,
  workout: HevyWorkout
) => {
  if (!interaction.deferred) await interaction.deferUpdate();
  await interaction.editReply(
    sharabledWorkoutEphemeralOptions(
      workout,
      "standard"
    ) as InteractionEditReplyOptions
  );

  // Clean up the select menu context
  context.dispose();
};

export const handleWorkoutSelectMenuSelection: OnStringSelectMenuKitSubmit =
  async (interaction, context) => {
    const selection = interaction.values[0];

    const workout = await getWorkout(selection);

    await handleSelectWorkout(
      interaction as unknown as StringSelectMenuInteraction,
      context,
      workout
    );
  };

export const handleMessageClick = async (
  interaction: ButtonInteraction,
  context: ButtonKit,
  workout: HevyWorkout
) => {
  console.log("handleMessageClick", interaction.customId);
  context.dispose();
  const desiredFormat = interaction.customId.split("--")[1];

  if (interaction.customId.startsWith("sendInChat")) {
    if (!interaction.deferred) await interaction.deferReply();
    await interaction.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        toComponent(
          workout,
          (["simple", "standard", "detailed"].includes(desiredFormat)
            ? desiredFormat
            : "simple") as WorkoutComponentFormat
        ),
      ],
    });
  } else if (interaction.customId.startsWith("changeWorkoutFormat")) {
    if (["simple", "standard", "detailed"].includes(desiredFormat)) {
      await changeWorkoutFormat(
        interaction as unknown as ButtonInteraction,
        workout,
        desiredFormat as WorkoutComponentFormat
      );
    } else {
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: `The format "${desiredFormat}" does not exists.`,
      });
    }
  } else {
    await interaction.followUp({
      flags: MessageFlags.Ephemeral,
      content: `Unhandle interaction  ${interaction.customId}`,
    });
  }
};
