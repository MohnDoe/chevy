import { prisma } from "@repo/db";

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
      OR: [
        {
          hevyProfilePrivate: true,
          isFollowedByHevyBot: true,
        },
        {
          hevyProfilePrivate: false,
          isFollowingHevyBot: true,
        },
      ],
    },
  });
}

export async function isDiscordUserAlreadyLinked(discordId: string) {
  return await prisma.user.findUnique({
    where: {
      discordId,
      OR: [
        {
          hevyUsername: {
            not: null,
          },
          hevyProfilePrivate: true,
          isFollowedByHevyBot: true,
        },
        {
          hevyUsername: {
            not: null,
          },
          hevyProfilePrivate: false,
          isFollowingHevyBot: true,
        },
      ],
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
  isPrivate: boolean
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

export async function setIsFollowingHevyBot(
  discordId: string,
  follows: boolean
) {
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      isFollowingHevyBot: follows,
    },
  });
}

export async function setIsFollowedByHevyBot(
  discordId: string,
  followed: boolean
) {
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
