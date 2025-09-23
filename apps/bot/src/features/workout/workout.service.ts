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
  TextDisplayBuilder,
  subtext,
  userMention,
  TextChannel,
  BaseInteraction,
} from "discord.js";
import { track } from "commandkit/analytics";

import {
  ButtonKit,
  OnStringSelectMenuKitSubmit,
  StringSelectMenuKit,
} from "commandkit";
import {
  commandPrefix,
  toComponent,
  WorkoutComponentFormat,
} from "./workout.embeds";
import { getWorkout } from "@/features/hevy/hevy.api";
import { HevyWorkout } from "@/features/hevy/hevy.types";
import { sendActivity } from "../liveActivity/liveActivity.service";
import { prisma } from "@repo/db";
import { ShareReason } from "../../../../../packages/database/generated/prisma";

// From parsers.ts
const generateButtonCustomIdSuffix = (workout: HevyWorkout, extra: string) =>
  `${workout.short_id}-${new Date().toISOString()}-${extra}`;

const sharableWorkoutEphemeralOptions = async (
  workout: HevyWorkout,
  format: WorkoutComponentFormat,
  originalInteraction?: ChatInputCommandInteraction
): Promise<InteractionReplyOptions | InteractionEditReplyOptions> => {
  const workoutComponent = await toComponent(workout, format);
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
                  workout,
                  originalInteraction
                ),
              { once: true, time: 60_000 }
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
                  workout,
                  originalInteraction
                ),
              { once: true, time: 60_000 }
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
                  workout,
                  originalInteraction
                ),
              { once: true, time: 60_000 }
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
              handleMessageClick(
                i as unknown as ButtonInteraction,
                c,
                workout,
                originalInteraction
              ),
            { once: true, time: 60_000 }
          ),
      ]),
    ],
  };
};

// From interactions.ts
export async function followUpWithWorkoutEphemeral(
  interaction: ChatInputCommandInteraction,
  workout: HevyWorkout | null
) {
  if (workout) {
    await interaction.followUp(
      (await sharableWorkoutEphemeralOptions(
        workout,
        "standard",
        interaction
      )) as InteractionReplyOptions
    );
  } else {
    await interaction.reply({
      content: "No workout found !",
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function changeWorkoutFormat(
  interaction: ButtonInteraction,
  workout: HevyWorkout,
  format: WorkoutComponentFormat,
  originalInteraction?: ChatInputCommandInteraction
) {
  if (!interaction.deferred) await interaction.deferUpdate();
  await interaction.editReply(
    (await sharableWorkoutEphemeralOptions(
      workout,
      format,
      originalInteraction
    )) as InteractionEditReplyOptions
  );
}

// From handlers.ts
export const handleSelectWorkout = async (
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  context: ButtonKit | StringSelectMenuKit,
  workout: HevyWorkout,
  originalInteraction?: ChatInputCommandInteraction
) => {
  if (!interaction.deferred) await interaction.deferUpdate();
  await interaction.editReply(
    (await sharableWorkoutEphemeralOptions(
      workout,
      "standard",
      originalInteraction
    )) as InteractionEditReplyOptions
  );
  context.dispose();
};

export const handleWorkoutSelectMenuSelection = async (
  interaction: StringSelectMenuInteraction,
  context: StringSelectMenuKit,
  originalInteraction?: ChatInputCommandInteraction
) => {
  const selection = interaction.values[0];
  const workout = await getWorkout(selection);
  await handleSelectWorkout(
    interaction as unknown as StringSelectMenuInteraction,
    context,
    workout,
    originalInteraction
  );
};

const handleMessageClick = async (
  interaction: ButtonInteraction,
  context: ButtonKit,
  workout: HevyWorkout,
  originalInteraction?: ChatInputCommandInteraction
) => {
  context.dispose();
  const desiredFormat = interaction.customId.split(
    "--"
  )[1] as WorkoutComponentFormat;

  if (interaction.customId.startsWith("sendInChat")) {
    let components = [];

    if (originalInteraction) {
      if (originalInteraction.isChatInputCommand())
        components.push(commandPrefix(originalInteraction));
      await originalInteraction.deleteReply();
    }

    components.push(await toComponent(workout, desiredFormat));

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
      interaction.user,
      interaction.channel,
      "commandUsed",
      desiredFormat,
      originalInteraction?.isCommand()
        ? originalInteraction.commandName +
            " " +
            originalInteraction.options.getSubcommand()
        : undefined
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
  } else if (interaction.customId.startsWith("changeWorkoutFormat")) {
    if (["simple", "standard", "detailed"].includes(desiredFormat)) {
      await changeWorkoutFormat(
        interaction as unknown as ButtonInteraction,
        workout,
        desiredFormat,
        originalInteraction
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

const saveWorkoutShare = async (
  workout: HevyWorkout,
  discordUser: BaseInteraction["user"],
  channel: BaseInteraction["channel"],
  reason: ShareReason,
  format: WorkoutComponentFormat,
  commandUsed?: string
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
                discordId: discordUser.id,
              },
            },
          },
        },
      },
      sharedBy: {
        connect: {
          discordId: discordUser.id,
        },
      },
    },
  });
};
