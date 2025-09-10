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
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import { getUserLatestWorkout, getUserWorkouts } from "../../../hevy/botApi";
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
import { toContainer } from "../../../hevy/utils/embedder";
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
      .setName("list")
      .setDescription("Select one from a list of recent workouts.")
  );

let workoutToShare: HevyWorkout | null;

function workoutEphemeralOptions(
  workout: HevyWorkout
): InteractionReplyOptions | InteractionEditReplyOptions {
  const workoutContainer = toContainer(workout);
  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      workoutContainer,
      // new ActionRowBuilder<ButtonBuilder>().setComponents([
      //   new ButtonKit()
      //     .setLabel("Send in chat")
      //     .setCustomId("sendInChat")
      //     .setStyle(ButtonStyle.Primary)
      //     .onClick(handleMessageClick),
      // ]),
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
      workoutToShare = await getUserLatestWorkout(user!.hevyUsername!);

      await followUpWithWorkoutEphemeral(interaction, workoutToShare);
      break;

    case "list":
      const workouts = await getUserWorkouts(user!.hevyUsername!, 1, 5);

      const selectRow = (
        <ActionRow>
          <StringSelectMenu
            placeholder="Select a workout"
            onSelect={(i, c) => handleSelectWorkout(i, c, workouts)}
            minValues={1}
            maxValues={1}
            customId="workoutSelect"
          >
            {workouts.map((w) => (
              <StringSelectMenuOption
                label={w.name}
                value={w.short_id}
                description={`${dayjs().to(w.created_at)} - ${dayjs(
                  w.created_at
                ).format("llll")}`}
              />
            ))}
          </StringSelectMenu>
        </ActionRow>
      );

      await interaction.followUp({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents((td) =>
              td.setContent("Select a workout.")
            )
            .addActionRowComponents(selectRow),
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
  interaction: StringSelectMenuInteraction,
  context: StringSelectMenuKit,
  workouts: HevyWorkout[]
) => {
  const selection = interaction.values[0];
  workoutToShare = workouts.find((w) => w.short_id === selection)!;

  await interaction.update(
    workoutEphemeralOptions(workoutToShare) as InteractionEditReplyOptions
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
      await interaction.deferReply();
      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: [toContainer(workoutToShare!)],
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
