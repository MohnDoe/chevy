import { cacheLife, cacheTag, revalidateTag } from "@commandkit/cache";
import { HevyVerification, prisma } from "@repo/db";

import client from "@/app";
import { MessageFlags, TextChannel, User } from "discord.js";
import { successfulyLinkedToHevy } from "../hevy/hevy.embeds";
import {
  getUserByDiscordId,
  UserWithHevyVerification,
} from "../hevy/hevy.service";
import { generatePrivateFollowInstructionsComponents } from "../hevy/verification.embeds";
import { Logger } from "commandkit";
export const setAutoShareEnabledStatus = async (
  guildId: string,
  user: UserWithHevyVerification,
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
  user: UserWithHevyVerification,
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

export const sendSuccessfullVerificationMessage = async (
  verification: HevyVerification,
) => {
  const user = client.users.cache.get(verification.userDiscordId);
  if (user) {
    Logger.info(`Sending verification DM`);
    try {
      await sendSuccessfullVerificationDM(user, verification);
    } catch (error) {
      Logger.warn(error);
      Logger.warn(
        `Failed to send verification DM. Replying to original interaction.`,
      );
      await sendSuccessfullVerificationViaInteraction(verification);
    }
  }
};

export const sendSuccessfullVerificationDM = async (
  user: User,
  verification: HevyVerification,
) => {
  await user.send({
    flags: MessageFlags.IsComponentsV2,
    components: successfulyLinkedToHevy(verification, false),
  });
};

export const sendSuccessfullVerificationViaInteraction = async (
  verification: HevyVerification,
) => {
  if (
    verification.originalInteractionChannelId == null ||
    verification.originalInteractionId == null
  )
    return;
  const channel = (await client.channels.fetch(
    verification.originalInteractionChannelId,
  )) as TextChannel;
  if (!channel) return;

  const interaction = await channel.messages.fetch(
    verification.originalInteractionId,
  );

  await interaction.reply({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,

    components: successfulyLinkedToHevy(verification, false),
  });
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
