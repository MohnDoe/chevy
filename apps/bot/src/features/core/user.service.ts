import { cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";
import { User } from "../../../../../packages/database/generated/prisma";
import { prisma } from "@repo/db";
import client from "@/app";
import { MessageFlags } from "discord.js";
import { successfulyLinkedToHevy } from "../hevy/hevy.embeds";
import { HevyUserVerificationWithUser } from "../hevy/verification.types";
import { generatePrivateFollowInstructionsComponents } from "../hevy/verification.embeds";
import { getUserByDiscordId } from "../hevy/hevy.service";

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

export const sendSuccessfullVerificationDM = async (
  verification: HevyUserVerificationWithUser,
) => {
  const user = client.users.cache.get(verification.userDiscordId);
  if (user) {
    await user.send({
      flags: MessageFlags.IsComponentsV2,
      components: await successfulyLinkedToHevy(verification.User, false),
    });
  }
};

export const sendPrivateAccountInstructionsDM = async (
  userDiscordId: string,
) => {
  const discordUser = client.users.cache.get(userDiscordId);

  if (discordUser) {
    const user = await getUserByDiscordId(userDiscordId);
    if (!user) return;
    await discordUser.send({
      flags: MessageFlags.IsComponentsV2,
      components: await generatePrivateFollowInstructionsComponents(
        user,
        user.isFollowedByHevyBot,
      ),
    });
  }
};

export const unlinkHevy = async (discordId: string) => {
  return await prisma.user.update({
    where: {
      discordId,
    },
    data: {
      hevyUsername: null,
      hevyVerification: {
        delete: {
          userDiscordId: discordId,
        },
      },
    },
  });
};
