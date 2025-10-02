import { prisma } from "@repo/db";
import { AutoShareWorkoutFormat } from "../../../../../packages/database/generated/prisma";
import { TextChannel } from "discord.js";
import { cache, cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";

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
  await prisma.server.update({
    where: {
      guildId,
    },
    data: {
      ServerAutoShareConfig: {
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
  await revalidateTag(`autoShare:enabledServers`);
  await revalidateTag(`autoShare:config:server:${guildId}`);
};

export const getAutoShareConfig = async (guildId: string) => {
  'use cache';
  cacheTag(`autoShare:config:server:${guildId}`);
  cacheLife('30d');
  return await prisma.serverAutoShareConfig.findUnique({
    where: {
      guildId,
    },
  });
};

export const getServerAutoShareParticipantsCount = async (guildId: string) => {
  'use cache';
  cacheTag(`autoShare:participants:server:${guildId}`);
  cacheLife('30d');
  return await prisma.userAutoShareConfig.count({
    where: {
      guildId,
      enabled: true,
    },
  });
};
