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
} from "../../../controllers/hevy/botApi";
import {
  ButtonKit,
  ChatInputCommandContext,
  CommandMetadata,
  OnButtonKitClick,
  useEnvironment,
} from "commandkit";
import { getUserByDiscordId } from "../../../controllers/user";
import { HevyWorkout } from "../../../types/hevy/botApi/workout.type";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import {
  toComponent,
  WorkoutComponentFormat,
} from "../../../controllers/hevy/utils/workoutParser";
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

function sharabledWorkoutEphemeralOptions(
  workout: HevyWorkout,
  format: WorkoutComponentFormat
): InteractionReplyOptions | InteractionEditReplyOptions {
  const workoutComponent = toComponent(workout, format);
  //makes it so the onClick event is not fired 10000 times
  const customIdSuffix = `${
    workout.short_id
  }-${format}-${new Date().toISOString()}`;

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
            .onClick(handleMessageClick, { once: true, time: 60_000 }),
          new ButtonKit()
            .setLabel(`Standard`)
            .setCustomId(`changeWorkoutFormat--standard--${customIdSuffix}`)
            .setDisabled(format == "standard")
            .setStyle(ButtonStyle.Secondary)
            .onClick(handleMessageClick, { once: true, time: 60_000 }),
          new ButtonKit()
            .setLabel("Detailed")
            .setDisabled(format == "detailed")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`changeWorkoutFormat--detailed--${customIdSuffix}`)
            .onClick(handleMessageClick, { once: true, time: 60_000 }),
        ])
      ),

      new ActionRowBuilder<ButtonBuilder>().setComponents([
        new ButtonKit()
          .setLabel("Send in chat 💬")
          .setCustomId(`sendInChat--${format}--${customIdSuffix}`)
          .setStyle(ButtonStyle.Primary)
          .onClick(handleMessageClick, { once: true, time: 60_000 }),
      ]),
    ],
  };
}

async function changeWorkoutFormat(
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

async function followUpWithWorkoutEphemeral(
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

export async function chatInput({
  interaction,
  client,
}: ChatInputCommandContext) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  // const env = useEnvironment();
  // const user = env.context?.store.get("user") as User;
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
    sharabledWorkoutEphemeralOptions(
      _workoutToShare,
      "standard"
    ) as InteractionEditReplyOptions
  );

  // Clean up the select menu context
  context.dispose();
};

const handleMessageClick: OnButtonKitClick = async (
  interaction: ButtonInteraction,
  context: ButtonKit
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
          _workoutToShare!,
          (["simple", "standard", "detailed"].includes(desiredFormat)
            ? desiredFormat
            : "simple") as WorkoutComponentFormat
        ),
      ],
    });
  } else if (interaction.customId.startsWith("changeWorkoutFormat")) {
    if (["simple", "standard", "detailed"].includes(desiredFormat)) {
      await changeWorkoutFormat(
        interaction,
        _workoutToShare!,
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

export const metadata: CommandMetadata = {};
