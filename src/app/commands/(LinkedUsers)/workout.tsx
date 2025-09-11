import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageFlags,
  PermissionFlagsBits,
  SectionBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  subtext,
  TextDisplayBuilder,
} from "discord.js";

import {
  getUserLatestWorkout,
  getUserWorkouts,
  getWorkout,
} from "../../../hevy/botApi";
import {
  ActionRow,
  AutocompleteCommand,
  ButtonKit,
  ChatInputCommandContext,
  CommandMetadata,
  OnButtonKitClick,
  OnStringSelectMenuKitSubmit,
  StringSelectMenu,
  StringSelectMenuKit,
  StringSelectMenuOption,
} from "commandkit";
import { getUserByDiscordId } from "../../../controllers/user";
import { HevyWorkout } from "../../../types/hevy/workout.type";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import { toComponent } from "../../../hevy/utils/embedder";
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

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
  );

let _workoutToShare: HevyWorkout | null;

function workoutEphemeralOptions(
  workout: HevyWorkout
): InteractionReplyOptions | InteractionEditReplyOptions {
  const workoutComponent = toComponent(workout, "small");

  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      workoutComponent,
      new ActionRowBuilder<ButtonBuilder>().setComponents([
        new ButtonKit()
          .setLabel("Send in chat")
          .setCustomId("sendInChat")
          .setStyle(ButtonStyle.Primary)
          .onClick(handleMessageClick),
      ]),
    ],
  };
}

async function followUpWithWorkoutEphemeral(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction,
  workout: HevyWorkout | null
) {
  if (workout) {
    await interaction.followUp(
      workoutEphemeralOptions(workout) as InteractionReplyOptions
    );
  } else {
    await interaction.reply({
      content: "No workout found !",
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function chatInput({
  interaction,
  client,
}: ChatInputCommandContext) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  const user = await getUserByDiscordId(interaction.user.id);

  switch (interaction.options.getSubcommand()) {
    case "latest":
      _workoutToShare = await getUserLatestWorkout(user!.hevyUsername!);

      await followUpWithWorkoutEphemeral(interaction, _workoutToShare);
      break;

    case "recent":
      const currentPage = 1;

      const paginationActionRow = new ActionRowBuilder().addComponents(
        new ButtonKit()
          .setLabel("<")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("recent-workouts--previous")
          .onClick(() => {}),
        new ButtonBuilder()
          .setLabel(`Page ${currentPage}/30`)
          .setDisabled(true)
          .setCustomId("pagination-label-recent-workouts")
          .setStyle(ButtonStyle.Secondary),
        new ButtonKit()
          .setLabel(">")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("recent-workouts--next")
          .onClick(() => {})
      );

      const workouts = await getUserWorkouts(
        user!.hevyUsername!,
        currentPage,
        5
      );
      const paginatedWorkoutsContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("### Your recent workouts")
        )
        .addSectionComponents(
          workouts.map((workout) =>
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(workout.name),
                new TextDisplayBuilder().setContent(
                  subtext(
                    `${dayjs().to(workout.created_at)} - ${dayjs(
                      workout.created_at
                    ).format("llll")}`
                  )
                )
              )
              .setButtonAccessory(
                new ButtonKit()
                  .setStyle(ButtonStyle.Secondary)
                  .setLabel("View")
                  .setCustomId(`preview-workout--${workout.short_id}`)
                  .onClick((i, c) =>
                    handleSelectWorkout(i, c, workout.short_id)
                  )
              )
          )
        );

      await interaction.editReply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          paginatedWorkoutsContainer,
          // paginationActionRow.toJSON()
        ],
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

const handleSelectWorkout = async (
  interaction: ButtonInteraction,
  context: ButtonKit,
  workoutShortId: string
) => {
  if (!interaction.deferred) await interaction.deferUpdate();
  _workoutToShare = await getWorkout(workoutShortId);
  await interaction.editReply(
    workoutEphemeralOptions(_workoutToShare) as InteractionEditReplyOptions
  );

  // Clean up the select menu context
  context.dispose();
};

const handleMessageClick: OnButtonKitClick = async (
  interaction: ButtonInteraction,
  context: ButtonKit
) => {
  switch (interaction.customId) {
    case "sendInChat":
      if (!interaction.deferred) await interaction.deferReply();
      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: [toComponent(_workoutToShare!, "small")],
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
