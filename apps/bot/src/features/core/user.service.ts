import { prisma, Server, User } from "@repo/db";

export const setAutoShareEnabledStatus = async (
  guildId: string,
  user: User,
  enabled: boolean
) => {
  return prisma.userAutoShareConfig.upsert({
    where: {
      userId_guildId: {
        guildId,
        userId: user.id,
      },
    },
    create: {
      guildId,
      userId: user.id,
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

export const getLastWorkoutCheck = async (userId: string, guildId: string) => {
  const user = await prisma.userAutoShareConfig.findFirst({
    where: {
      guildId,
      userId,
    },
    select: {
      lastWorkoutCheck: true,
    },
  });

  return user?.lastWorkoutCheck;
}

export const updateUserLastWorkoutCheck = async (user: User, server: Server) => {
  return await prisma.userAutoShareConfig.upsert({
    where: {
      userId_guildId: {
        guildId: server.guildId,
        userId: user.id,
      },
    },
    create: {
      guildId: server.guildId,
      userId: user.id,
      lastWorkoutCheck: new Date(),
    },
    update: {
      lastWorkoutCheck: new Date(),
    },
  })
};
