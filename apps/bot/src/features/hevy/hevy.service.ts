import { prisma, Prisma } from "@repo/db";
import { track } from "commandkit/analytics";

export type UserWithHevyVerification = Prisma.UserGetPayload<{
  include: {
    hevyVerification: true;
  };
}>;
export async function getUserByDiscordId(
  discordId: string,
): Promise<UserWithHevyVerification | null> {
  return await prisma.user.findUnique({
    where: {
      discordId,
    },
    include: {
      hevyVerification: true,
    },
  });
}

export async function getHevyVerifiedUserByHevyUsername(hevyUsername: string) {
  return await prisma.user.findFirst({
    where: {
      hevyVerification: {
        username: hevyUsername,
        status: "verified",
      },
    },
  });
}

export async function getHevyVerifiedUserByDiscordId(
  discordId: string,
): Promise<UserWithHevyVerification | null> {
  return await prisma.user.findUnique({
    where: {
      discordId,
      hevyVerification: {
        status: "verified",
      },
    },
    include: {
      hevyVerification: true,
    },
  });
}

export async function setUserHevyUsername(discordId: string, username: string) {
  return await prisma.hevyVerification.update({
    where: {
      userDiscordId: discordId,
    },
    data: {
      username,
    },
  });
}
export async function setIsHevyProfilePrivate(
  discordId: string,
  isPrivate: boolean,
) {
  return await prisma.hevyVerification.update({
    where: {
      userDiscordId: discordId,
    },
    data: {
      privateProfile: isPrivate,
    },
  });
}

export async function setIsFollowedByHevyBot(
  discordId: string,
  followed: boolean,
) {
  await prisma.hevyVerification.update({
    where: {
      userDiscordId: discordId,
    },
    data: {
      followedByBot: followed,
    },
  });
  track({
    name: "followed by hevy bot",
    id: "discord_user_" + discordId,
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
