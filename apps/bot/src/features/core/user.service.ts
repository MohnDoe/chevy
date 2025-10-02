import { cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";
import { prisma, User } from "@repo/db";

export const setAutoShareEnabledStatus = async (
  guildId: string,
  user: User,
  enabled: boolean
) => {
  await prisma.userAutoShareConfig.upsert({
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
  await revalidateTag(`autoShare:enabledUsers:server:${guildId}`);
  await revalidateTag(`autoShare:config:user:${user.id}`);
  await revalidateTag(`autoShare:participants:server:${guildId}`);
};

export const getUserAutoShareConfig = async (
  guildId: string,
  userId: string
) => {
  'use cache';
  cacheTag(`autoShare:config:user:${userId}`);
  cacheLife('30d');
  return prisma.userAutoShareConfig.findUnique({
    where: {
      userId_guildId: {
        guildId,
        userId,
      },
    },
  });
};