import { cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";
import { User } from "../../../../../packages/database/generated/prisma";
import { prisma } from "@repo/db";

export const updateLastBotFollowRequest = async (user: User) => {
  "use cache";
  revalidateTag(`user:${user.discordId}:lastBotFollowRequestion`);
  await prisma.user.update({
    where: {
      discordId: user.discordId,
      id: user.id,
    },
    data: {
      lastBotFollowRequest: new Date(),
    },
  });
};

export const getLastBotFollowRequest = async (user: User) => {
  "use cache";
  cacheTag(`user:${user.discordId}:lastBotFollowRequestion`);
  cacheLife("30m");
  return await prisma.user.findUnique({
    where: {
      discordId: user.discordId,
      id: user.id,
    },
    select: {
      lastBotFollowRequest: true,
    },
  });
};
