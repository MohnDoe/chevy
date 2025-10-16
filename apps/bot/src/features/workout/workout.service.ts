import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageFlags,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextChannel,
  DiscordAPIError,
  BaseInteraction,
} from "discord.js";
import { track } from "commandkit/analytics";

import { ButtonKit, StringSelectMenuKit } from "commandkit";
import { commandPrefix, toComponent } from "./workout.embeds";
import { getWorkout } from "@/features/hevy/hevy.api";
import { HevyWorkout } from "@/features/hevy/hevy.types";
import { sendActivity } from "../liveActivity/liveActivity.service";
import { handleDiscordAPIError } from "../discord/error.service";
import { prisma, ShareReason, WorkoutFormat } from "@repo/db";
import { capitalizeFirstLetter } from "../core/utils";

export const AVAILABLE_AUTO_SHARE_FORMATS: WorkoutFormat[] = [
  WorkoutFormat.line,
  WorkoutFormat.compact,
  WorkoutFormat.standard,
];

export const AVAILABLE_USER_SHARABLE_FORMATS: WorkoutFormat[] = [
  WorkoutFormat.compact,
  WorkoutFormat.standard,
];

const generateButtonCustomIdSuffix = (workout: HevyWorkout, extra: string) =>
  `${workout.short_id}-${new Date().toISOString()}-${extra}`;

const sharableWorkoutEphemeralOptions = async (
  workout: HevyWorkout,
  format: WorkoutFormat,
  originalInteraction?: ChatInputCommandInteraction,
): Promise<InteractionReplyOptions | InteractionEditReplyOptions> => {
  const workoutComponent = await toComponent(workout, format);
  const customIdSuffix = generateButtonCustomIdSuffix(workout, format);

  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      workoutComponent,
      new ContainerBuilder().addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          AVAILABLE_USER_SHARABLE_FORMATS.map((f) =>
            new ButtonKit()
              .setLabel(capitalizeFirstLetter(f))
              .setDisabled(format == f)
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`changeWorkoutFormat--${f}--${customIdSuffix}`)
              .onClick(
                (i, c) =>
                  handleMessageClick(
                    i as unknown as ButtonInteraction,
                    c,
                    workout,
                    originalInteraction,
                  ),
                { once: true, time: 60_000 },
              ),
          ),
        ),
      ),
      new ActionRowBuilder<ButtonBuilder>().setComponents([
        new ButtonKit()
          .setLabel("Send in chat")
          .setCustomId(`sendInChat--${format}--${customIdSuffix}`)
          .setStyle(ButtonStyle.Primary)
          .onClick(
            (i, c) =>
              handleMessageClick(
                i as unknown as ButtonInteraction,
                c,
                workout,
                originalInteraction,
              ),
            { once: true, time: 60_000 },
          ),
      ]),
    ],
  };
};

// From interactions.ts
export const followUpWithWorkoutEphemeral = async (
  interaction: ChatInputCommandInteraction,
  workout: HevyWorkout | null,
) => {
  if (workout) {
    await interaction.followUp(
      (await sharableWorkoutEphemeralOptions(
        workout,
        "standard",
        interaction,
      )) as InteractionReplyOptions,
    );
  } else {
    await interaction.reply({
      content: "No workout found !",
      flags: MessageFlags.Ephemeral,
    });
  }
};

const changeWorkoutFormat = async (
  interaction: ButtonInteraction,
  workout: HevyWorkout,
  format: WorkoutFormat,
  originalInteraction?: ChatInputCommandInteraction,
) => {
  if (!interaction.deferred) await interaction.deferUpdate();
  await interaction.editReply(
    (await sharableWorkoutEphemeralOptions(
      workout,
      format,
      originalInteraction,
    )) as InteractionEditReplyOptions,
  );
};

export const handleSelectWorkout = async (
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  context: ButtonKit | StringSelectMenuKit,
  workout: HevyWorkout,
  originalInteraction?: ChatInputCommandInteraction,
) => {
  if (!interaction.deferred) await interaction.deferUpdate();
  await interaction.editReply(
    (await sharableWorkoutEphemeralOptions(
      workout,
      "standard",
      originalInteraction,
    )) as InteractionEditReplyOptions,
  );
  context.dispose();
};

export const handleWorkoutSelectMenuSelection = async (
  interaction: StringSelectMenuInteraction,
  context: StringSelectMenuKit,
  originalInteraction?: ChatInputCommandInteraction,
) => {
  const selection = interaction.values[0];
  const workout = await getWorkout(selection);
  await handleSelectWorkout(
    interaction as unknown as StringSelectMenuInteraction,
    context,
    workout,
    originalInteraction,
  );
};

const handleMessageClick = async (
  interaction: ButtonInteraction,
  context: ButtonKit,
  workout: HevyWorkout,
  originalInteraction?: ChatInputCommandInteraction,
) => {
  context.dispose();
  const desiredFormat = interaction.customId.split("--")[1] as WorkoutFormat;

  if (interaction.customId.startsWith("sendInChat")) {
    let components = [];

    if (originalInteraction) {
      if (originalInteraction.isChatInputCommand())
        components.push(commandPrefix(originalInteraction));
      await originalInteraction.deleteReply();
    }

    components.push(await toComponent(workout, desiredFormat));

    try {
      if (interaction.channel && interaction.channel instanceof TextChannel) {
        // send directly in channel
        await interaction.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components,
        });
      } else {
        if (!interaction.deferred) await interaction.deferReply();
        // to follow up as fallback
        await interaction.followUp({
          flags: MessageFlags.IsComponentsV2,
          components,
        });
      }

      saveWorkoutShare(
        workout,
        interaction.user.id,
        interaction.channel,
        "commandUsed",
        desiredFormat,
        originalInteraction?.isCommand()
          ? originalInteraction.commandName +
              " " +
              originalInteraction.options.getSubcommand()
          : undefined,
      );

      sendActivity(`Someone **shared a workout**.`);

      track({
        name: "workout shared",
        id: "discord_user_" + interaction.user.id,
        data: {
          contextType: interaction.context,
          channelType: interaction.channel?.type,
          format: desiredFormat,
          responseTime: Date.now() - interaction.createdTimestamp,
        },
      });
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        await handleDiscordAPIError(error, interaction);
      }
    }
  } else if (interaction.customId.startsWith("changeWorkoutFormat")) {
    if (AVAILABLE_USER_SHARABLE_FORMATS.includes(desiredFormat)) {
      await changeWorkoutFormat(
        interaction as unknown as ButtonInteraction,
        workout,
        desiredFormat,
        originalInteraction,
      );

      track({
        name: "workout format changed",
        id: "discord_user_" + interaction.user.id,
        data: {
          contextType: interaction.context,
          channelType: interaction.channel?.type,
          format: desiredFormat,
          workout: workout,
          responseTime: Date.now() - interaction.createdTimestamp,
        },
      });
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

export const saveWorkoutShare = async (
  workout: HevyWorkout,
  discordUserId: string,
  channel: BaseInteraction["channel"],
  reason: ShareReason,
  format: WorkoutFormat,
  commandUsed?: string,
) => {
  return prisma.share.create({
    data: {
      channelId: channel!.id,
      channelType: channel!.type as number,
      reason: reason,
      format,
      commandUsed,
      Workout: {
        connectOrCreate: {
          where: {
            hevyWorkoutId: workout.id,
          },
          create: {
            createdAt: workout.created_at,
            hevyWorkoutId: workout.id,
            hevyWorkoutShortId: workout.short_id,
            User: {
              connect: {
                discordId: discordUserId,
              },
            },
          },
        },
      },
      sharedBy:
        reason !== "autoShared"
          ? {
              connect: {
                discordId: discordUserId,
              },
            }
          : undefined,
    },
  });
};
