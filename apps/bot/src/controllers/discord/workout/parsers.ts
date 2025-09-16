import { ButtonKit } from "commandkit";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ContainerBuilder,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageFlags,
} from "discord.js";

import {
  toComponent,
  WorkoutComponentFormat,
} from "@/controllers/hevy/utils/workoutParser";
import { HevyWorkout } from "@/types/hevy/botApi/workout.type";
import { handleMessageClick } from "./handlers";

export const generateButtonCustomIdSuffix = (
  workout: HevyWorkout,
  extra: string
) => `${workout.short_id}-${new Date().toISOString()}-${extra}`;

export const sharabledWorkoutEphemeralOptions = (
  workout: HevyWorkout,
  format: WorkoutComponentFormat
): InteractionReplyOptions | InteractionEditReplyOptions => {
  const workoutComponent = toComponent(workout, format);
  //makes it so the onClick event is not fired 10000 times
  const customIdSuffix = generateButtonCustomIdSuffix(workout, format);

  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      workoutComponent,
      new ContainerBuilder().addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().setComponents([
          new ButtonKit()
            .setLabel("Simple")
            .setDisabled(format == "simple")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`changeWorkoutFormat--simple--${customIdSuffix}`)
            .onClick(
              (i, c) =>
                handleMessageClick(
                  i as unknown as ButtonInteraction,
                  c,
                  workout
                ),
              {
                once: true,
                time: 60_000,
              }
            ),
          new ButtonKit()
            .setLabel(`Standard`)
            .setCustomId(`changeWorkoutFormat--standard--${customIdSuffix}`)
            .setDisabled(format == "standard")
            .setStyle(ButtonStyle.Secondary)
            .onClick(
              (i, c) =>
                handleMessageClick(
                  i as unknown as ButtonInteraction,
                  c,
                  workout
                ),
              {
                once: true,
                time: 60_000,
              }
            ),
          new ButtonKit()
            .setLabel("Detailed")
            .setDisabled(format == "detailed")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`changeWorkoutFormat--detailed--${customIdSuffix}`)
            .onClick(
              (i, c) =>
                handleMessageClick(
                  i as unknown as ButtonInteraction,
                  c,
                  workout
                ),
              {
                once: true,
                time: 60_000,
              }
            ),
        ])
      ),

      new ActionRowBuilder<ButtonBuilder>().setComponents([
        new ButtonKit()
          .setLabel("Send in chat")
          .setCustomId(`sendInChat--${format}--${customIdSuffix}`)
          .setStyle(ButtonStyle.Primary)
          .onClick(
            (i, c) =>
              handleMessageClick(i as unknown as ButtonInteraction, c, workout),
            { once: true, time: 60_000 }
          ),
      ]),
    ],
  };
};
