import { cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";
import { prisma, WorkoutFormat } from "@repo/db";
import { TextChannel } from "discord.js";
import { ServerWithAutoShareConfig } from "../autoShare/autoShare.types";

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
  format: WorkoutFormat,
): Promise<ServerWithAutoShareConfig> => {
  await revalidateTag(`autoShare:enabledServers`);
  await revalidateTag(`autoShare:config:server:${guildId}`);

  return await prisma.server.update({
    where: {
      guildId,
    },
    include: {
      ServerAutoShareConfig: true,
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
};

export const getAutoShareConfig = async (guildId: string) => {
  "use cache";
  cacheTag(`autoShare:config:server:${guildId}`);
  cacheLife("60s");
  return await prisma.serverAutoShareConfig.findUnique({
    where: {
      guildId,
    },
  });
};

export const getServerAutoShareParticipantsCount = async (guildId: string) => {
  "use cache";
  cacheTag(`autoShare:participants:server:${guildId}`);
  cacheLife("1m");
  return await prisma.userAutoShareConfig.count({
    where: {
      guildId,
      enabled: true,
    },
  });
};
