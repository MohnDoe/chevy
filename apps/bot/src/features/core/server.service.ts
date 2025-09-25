import { prisma } from "@repo/db";
import { AutoShareWorkoutFormat } from "../../../../../packages/database/generated/prisma";
import { TextChannel } from "discord.js";

export const upsertServer = async (guildId: string) => {
  return await prisma.server.upsert({
    where: {
      guildId,
    },
    create: {
      guildId,
    },
    update: {},
  });
};

export const saveAutoShareConfig = async (
  guildId: string,
  enabled: boolean,
  channel: TextChannel,
  format: AutoShareWorkoutFormat
) => {
  return await prisma.server.update({
    where: {
      guildId,
    },
    data: {
      AutoShareConfig: {
        upsert: {
          where: {
            guildId,
          },
          create: {
            enabled,
            channelId: channel.id,
            workoutFormat: format,
          },
          update: {
            enabled,
            channelId: channel.id,
            workoutFormat: format,
          },
        },
      },
    },
  });
};

export const getAutoShareConfig = async (guildId: string) => {
  return await prisma.serverAutoShareConfig.findUnique({
    where: {
      guildId,
    },
  });
};
