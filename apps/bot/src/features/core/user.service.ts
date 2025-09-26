import { prisma } from "@repo/db";

export const setAutoShareEnabledStatus = async (
  guildId: string,
  userId: string,
  enabled: boolean
) => {
  return prisma.userAutoShareConfig.upsert({
    where: {
      userId_guildId: {
        guildId,
        userId,
      },
    },
    create: {
      guildId,
      userId,
      enabled,
    },
    update: {
      enabled,
    },
  });
};

export const getUserAutoShareConfig = async (
  guildId: string,
  userId: string
) => {
  return prisma.userAutoShareConfig.findUnique({
    where: {
      userId_guildId: {
        guildId,
        userId,
      },
    },
  });
};

export const getAllUserAutoShareConfigs = async (guildId: string) => {
  return prisma.userAutoShareConfig.findMany({
    where: {
      guildId,
    },
  });
};

export const updateUserLastWorkoutCheck = async (discordId: string) => {
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      lastWorkoutCheck: new Date(),
    },
  });
};
