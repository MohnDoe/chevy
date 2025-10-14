import { cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";
import { HevyVerification, prisma, User } from "@repo/db";

import client from "@/app";
import { MessageFlags } from "discord.js";
import { successfulyLinkedToHevy } from "../hevy/hevy.embeds";
import { generatePrivateFollowInstructionsComponents } from "../hevy/verification.embeds";
import { getUserByDiscordId } from "../hevy/hevy.service";
export const setAutoShareEnabledStatus = async (
  guildId: string,
  user: User,
  enabled: boolean,
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
};

export const setAutoShareEnabledStatusInAllServers = async (
  user: User,
  enabled: boolean,
  guildIdToUpsert?: string,
) => {
  const updatedConfigs = await prisma.userAutoShareConfig.updateManyAndReturn({
    where: {
      userId: user.id,
    },
    data: {
      enabled,
    },
  });

  if (guildIdToUpsert)
    await setAutoShareEnabledStatus(guildIdToUpsert, user, enabled);

  await Promise.all(
    updatedConfigs.map(
      async (config) =>
        await revalidateTag(`autoShare:enabledUsers:server:${config.guildId}`),
    ),
  );

  await revalidateTag(`autoShare:config:user:${user.id}`);
};
export const getUserAutoShareConfig = async (
  guildId: string,
  userId: string,
) => {
  "use cache";
  cacheTag(`autoShare:config:user:${userId}`);
  cacheLife("10m");
  return prisma.userAutoShareConfig.findUnique({
    where: {
      userId_guildId: {
        guildId,
        userId,
      },
    },
  });
};

export const sendSuccessfullVerificationDM = async (
  verification: HevyVerification,
) => {
  const user = client.users.cache.get(verification.userDiscordId);
  if (user) {
    await user.send({
      flags: MessageFlags.IsComponentsV2,
      components: successfulyLinkedToHevy(verification, false),
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
      components: generatePrivateFollowInstructionsComponents(
        user.hevyVerification!,
        user.hevyVerification!.followedByBot,
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
      hevyVerification: {
        delete: {
          userDiscordId: discordId,
        },
      },
    },
  });
};
