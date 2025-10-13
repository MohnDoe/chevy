import { prisma } from "@repo/db";
import client from "@/app";
import { MessageFlags } from "discord.js";
import { successfulyLinkedToHevy } from "../hevy/hevy.embeds";
import { HevyUserVerificationWithUser } from "../hevy/verification.types";
import { generatePrivateFollowInstructionsComponents } from "../hevy/verification.embeds";
import { getUserByDiscordId } from "../hevy/hevy.service";

export const sendSuccessfullVerificationDM = async (
  verification: HevyUserVerificationWithUser,
) => {
  const user = client.users.cache.get(verification.userDiscordId);
  if (user) {
    await user.send({
      flags: MessageFlags.IsComponentsV2,
      components: await successfulyLinkedToHevy(verification, false),
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
