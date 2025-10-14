import { revalidateTag } from "@commandkit/cache";
import { HevyVerification, prisma, Prisma } from "@repo/db";

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

export async function getUserByHevyUsername(hevyUsername: string) {
  return await prisma.user.findFirst({
    where: {
      hevyVerification: {
        username: hevyUsername,
        status: "verified",
      },
    },
  });
}

export async function getUserVerification(
  discordId: string,
): Promise<HevyVerification | null> {
  return await prisma.hevyVerification.findUnique({
    where: {
      userDiscordId: discordId,
    },
    include: {
      User: true,
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
  "use cache";
  revalidateTag(`user:${discordId}:lastBotFollowRequestion`);
  return await prisma.hevyVerification.update({
    where: {
      userDiscordId: discordId,
    },
    data: {
      followedByBot: followed,
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
