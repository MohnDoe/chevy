import { revalidateTag } from "@commandkit/cache";
import { prisma } from "@repo/db";
import { HevyUserVerificationWithUser } from "./verification.types";

export async function getUserByDiscordId(discordId: string) {
  return await prisma.user.findUnique({
    where: {
      discordId,
    },
  });
}

export async function getUserByHevyUsername(hevyUsername: string) {
  return await prisma.user.findUnique({
    where: {
      hevyUsername,
      hevyUserVerifications: {
        some: {
          userHevyUsername: hevyUsername,
          status: "verified",
        },
      },
    },
  });
}

export async function getUserVerification(
  discordId: string,
): Promise<HevyUserVerificationWithUser | null> {
  return await prisma.hevyUserVerification.findFirst({
    where: {
      User: {
        discordId,
      },
    },
    include: {
      User: true,
    },
  });
}

export async function setUserHevyUsername(discordId: string, username: string) {
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      hevyUsername: username,
    },
  });
}

export async function setIsHevyProfilePrivate(
  discordId: string,
  isPrivate: boolean,
) {
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      hevyProfilePrivate: isPrivate,
    },
  });
}

export async function setIsFollowedByHevyBot(
  discordId: string,
  followed: boolean,
) {
  "use cache";
  revalidateTag(`user:${discordId}:lastBotFollowRequestion`);
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      isFollowedByHevyBot: followed,
    },
  });
}

export const upsertUser = async (discordId: string) => {
  return await prisma.user.upsert({
    where: {
      discordId,
    },
    create: {
      discordId,
    },
    update: {},
  });
};
