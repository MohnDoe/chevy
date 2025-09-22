import {
  ActionRow,
  ChatInputCommandContext,
  StringSelectMenu,
  StringSelectMenuOption,
  TextDisplay,
} from "commandkit";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
  TextDisplayBuilder,
} from "discord.js";

import {
  followUpWithWorkoutEphemeral,
  handleWorkoutSelectMenuSelection,
} from "@/features/workout/workout.service";
import {
  getUserLatestWorkout,
  getUserWorkouts,
  getWorkout,
} from "@/features/hevy/hevy.api";
import { getWorkoutShortIdFromUrl } from "@/features/workout/workout.embeds";

export const command = new SlashCommandBuilder()
  .setName("workout")
  .setDescription("See and share your workouts.")
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
      .setName("recent")
      .setDescription("Select one from a list of recent workouts.")
  )
  .addSubcommand((sc) =>
    sc
      .setName("url")
      .setDescription("Share one of your workout using a URL.")
      .addStringOption((so) =>
        so
          .setAutocomplete(false)
          .setName("url")
          .setDescription("URL to your workout.")
          .setRequired(true)
          .setMinLength(10)
      )
  );

export async function chatInput({
  interaction,
  store,
}: ChatInputCommandContext) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  const user = store.get("user");
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "latest":
    case "url":
      let workout;
      if (subcommand == "url") {
        const url = interaction.options.getString("url");
        if (url) {
          const workoutShortId = getWorkoutShortIdFromUrl(url);
          if (workoutShortId) {
            workout = await getWorkout(workoutShortId);
          }
        }
      } else {
        workout = await getUserLatestWorkout(user!.hevyUsername!);
      }

      if (workout) {
        await followUpWithWorkoutEphemeral(
          interaction as unknown as ChatInputCommandInteraction,
          workout
        );
      } else {
        interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [
            new TextDisplayBuilder().setContent("Workout not found."),
          ],
        });
      }

      break;

    case "recent":
      const currentPage = 1;
      const workouts = await getUserWorkouts(
        user!.hevyUsername!,
        currentPage,
        5
      );

      await interaction.editReply({
        components: [
          <TextDisplay content="Which workout would you look to look at?" />,
          <ActionRow>
            <StringSelectMenu
              placeholder="Select a workout to preview and share."
              onSelect={(i, c) =>
                handleWorkoutSelectMenuSelection(
                  i as unknown as StringSelectMenuInteraction,
                  c,
                  interaction as unknown as ChatInputCommandInteraction
                )
              }
            >
              {workouts.map((workout) => (
                <StringSelectMenuOption
                  label={workout.name}
                  value={workout.short_id}
                  description={`${dayjs().to(workout.created_at)} - ${dayjs(
                    workout.created_at
                  ).format("llll")}`}
                />
              ))}
            </StringSelectMenu>
          </ActionRow>,
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });

      break;

    default:
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: `Command does not exist!`,
      });
      break;
  }
}
