import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    },
  });
}

export async function checkIfUserIsVerifiedOnHevy(discordId: string) {
  const user = await getUserByDiscordId(discordId);

  return !!user && user.isVerifiedOnHevy;
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

export async function setUserVerified(discordId: string, verified: boolean) {
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      isVerifiedOnHevy: verified,
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
      isVerifiedOnHevy: false,
    },
    update: {},
  });
};
