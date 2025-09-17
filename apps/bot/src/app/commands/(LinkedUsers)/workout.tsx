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

import { track } from "commandkit/analytics";

import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";

import {
  getUserLatestWorkout,
  getUserWorkouts,
  getWorkout,
} from "@/controllers/hevy/botApi.ts";
import { handleWorkoutSelectMenuSelection } from "@/controllers/discord/workout/handlers";
import { followUpWithWorkoutEphemeral } from "@/controllers/discord/workout/interactions";
import { getWorkoutShortIdFromUrl } from "@/controllers/hevy/utils/workoutParser";

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
        if (interaction.options.getString("url")) {
          const workoutShortId = getWorkoutShortIdFromUrl(
            interaction.options.getString("url")!
          );

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

      // const paginationActionRow = new ActionRowBuilder().addComponents(
      //   new ButtonKit()
      //     .setLabel("<")
      //     .setStyle(ButtonStyle.Primary)
      //     .setCustomId("recent-workouts--previous")
      //     .onClick(() => {}),
      //   new ButtonBuilder()
      //     .setLabel(`Page ${currentPage}/30`)
      //     .setDisabled(true)
      //     .setCustomId("pagination-label-recent-workouts")
      //     .setStyle(ButtonStyle.Secondary),
      //   new ButtonKit()
      //     .setLabel(">")
      //     .setStyle(ButtonStyle.Primary)
      //     .setCustomId("recent-workouts--next")
      //     .onClick(() => {})
      // );

      const workouts = await getUserWorkouts(
        user!.hevyUsername!,
        currentPage,
        5
      );

      console.log(workouts.length);

      // const workoutsSections = workouts.map((workout) => {
      //   const customIdSuffix = generateButtonCustomIdSuffix(workout, "");
      //   const section = new SectionBuilder()
      //     .addTextDisplayComponents(
      //       new TextDisplayBuilder().setContent(workout.name),
      //       new TextDisplayBuilder().setContent(
      //         subtext(
      //           `${dayjs().to(workout.created_at)} - ${dayjs(
      //             workout.created_at
      //           ).format("llll")}`
      //         )
      //       )
      //     )
      //     .setButtonAccessory(
      //       new ButtonKit()
      //         .setStyle(ButtonStyle.Primary)
      //         .setLabel("View")
      //         .setCustomId(
      //           `preview-workout--${workout.short_id}--${customIdSuffix}`
      //         )
      //         .onClick(
      //           (i, c) =>
      //             handleSelectWorkout(
      //               i as unknown as ButtonInteraction,
      //               c,
      //               workout
      //             ),
      //           { once: true }
      //         )
      //     );

      //   console.log(section.accessory);
      //   return section;
      // });

      await interaction.editReply({
        components: [
          <TextDisplay content="Which workout would you look to look at?" />,
          <ActionRow>
            <StringSelectMenu
              placeholder="Select a workout to preview and share."
              onSelect={handleWorkoutSelectMenuSelection}
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
        // paginationActionRow.toJSON()
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
