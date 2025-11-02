import verificationConfig from "@/config/verification.config";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { HevyVerification, prisma } from "@repo/db";
import { Logger } from "commandkit";
import { track } from "commandkit/analytics";
import {
  sendPrivateAccountInstructionsDM,
  sendSuccessfullVerificationDM,
} from "../core/user.service";
import { sendActivity } from "../liveActivity/liveActivity.service";
import {
  checkIfUserUserIsFollowedByBot,
  deleteComment,
  followUserOnHevy,
  getUserProfile,
  getWorkoutComments,
} from "./hevy.api";
import {
  setIsFollowedByHevyBot,
  setIsHevyProfilePrivate,
  setUserHevyUsername,
} from "./hevy.service";

const MAX_CODE_GENERATION_ATTEMPTS = 10;

export const generateVerificationCode = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

export const upsertVerificationCode = async (
  discordId: string,
  hevyUsername: string,
) => {
  Logger.info(`Inserting verification code: ${discordId} - ${hevyUsername}`);
  let verificationCode = "";
  let isCodeUnique = false;
  let userVerification = null;
  let attemptCount = 0;

  while (!isCodeUnique && attemptCount < MAX_CODE_GENERATION_ATTEMPTS) {
    attemptCount++;

    verificationCode = generateVerificationCode(
      verificationConfig.codeLength as number,
    );
    Logger.info(
      `${discordId} - Attemping inserting code : ${verificationCode}`,
    );
    try {
      userVerification = await prisma.hevyVerification.upsert({
        where: {
          userDiscordId: discordId,
        },
        create: {
          verificationCode: verificationCode,
          workoutId: verificationConfig.workoutShortId,
          userDiscordId: discordId,
          username: hevyUsername,
        },
        update: {
          username: hevyUsername,
        },
      });

      isCodeUnique = true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          Logger.info(
            `Verification code already exists, generating a new one...`,
          );
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  return userVerification;
};

const markVerificationAsDone = async (verification: HevyVerification) => {
  await prisma.hevyVerification.updateMany({
    where: {
      username: verification.username,
      userDiscordId: verification.userDiscordId,
      status: "pending",
    },
    data: {
      status: "verified",
    },
  });
  sendActivity(`Someone **linked their Hevy account**.`);
  track({
    name: "hevy linking success",
    id: "discord_user_" + verification.userDiscordId,
  });
};

export const getUserLatestPendingVerification = async (
  discordId: string,
  hevyUsername: string,
) => {
  return await prisma.hevyVerification.findUnique({
    where: {
      userDiscordId: discordId,
      username: hevyUsername,
      status: "pending",
    },
  });
};

export const getRemainingPrivateVerifications = async (): Promise<
  HevyVerification[]
> => {
  return await prisma.hevyVerification.findMany({
    where: {
      status: "verified",
      privateProfile: true,
      followedByBot: false,
    },
  });
};

export const getRemainingPendingVerifications = async (): Promise<
  HevyVerification[]
> => {
  return await prisma.hevyVerification.findMany({
    where: {
      status: "pending",
    },
    include: {
      User: true,
    },
  });
};

export const findOrCreateUserVerification = async (
  discordId: string,
  hevyUsername: string,
) => {
  let hevyVerification = await getUserLatestPendingVerification(
    discordId,
    hevyUsername,
  );

  if (hevyVerification == null) {
    Logger.info(`No verification for this user. Creating one.`);
    hevyVerification =
      (await upsertVerificationCode(discordId, hevyUsername)) ?? null;
  } else {
    Logger.info(`User verification already exists. Returning it.`);
  }

  return hevyVerification;
};

export const getVerificationWorkoutComments = async () => {
  return await getWorkoutComments(verificationConfig.workoutShortId);
};

export const getCorrespondingVerificationComment = async (
  verification: HevyVerification,
) => {
  const comments = await getVerificationWorkoutComments();

  const correspondingComment = comments.find(
    (comment) =>
      comment.comment.trim() === verification.verificationCode &&
      comment.username === verification.username,
  );

  if (!correspondingComment) return null;

  return correspondingComment;
};

export const executeVerificationTask = async () => {
  Logger.info("[verification] Executing task.");

  const pendingVerifications = await getRemainingPendingVerifications();

  if (pendingVerifications.length === 0) {
    Logger.info("[verification] No pending verification. Stopping.");
    return;
  }

  Logger.info(
    `[verification] ${pendingVerifications.length} pending verifications found.`,
  );

  for await (const verification of pendingVerifications) {
    Logger.info(
      `[verification] Handling verification : ${verification.username} - code: ${verification.verificationCode} - date: ${verification.createdAt}`,
    );
    const correspondingComment =
      await getCorrespondingVerificationComment(verification);
    const isVerificationDone = correspondingComment != null;

    Logger.info(
      `[verification] Verification #${verification.verificationCode} done? ${isVerificationDone}`,
    );

    if (isVerificationDone) {
      await markVerificationAsDone(verification);
      await setUserHevyUsername(
        verification.userDiscordId,
        verification.username,
      );
      const hevyProfile = await getUserProfile(verification.username);
      await setIsHevyProfilePrivate(
        verification.userDiscordId,
        hevyProfile.private_profile,
      );

      if (!hevyProfile.private_profile) {
        await sendSuccessfullVerificationDM(verification);
      }
      await deleteComment(correspondingComment.id);
    }
  }
};

export const markPrivateInstructionsAsSent = async (userDiscordId: string) => {
  await prisma.hevyVerification.update({
    where: {
      userDiscordId,
    },
    data: {
      privateInstructionsSent: true,
    },
  });
};

export const executePrivateVerifications = async () => {
  Logger.info("[private instructions] Executing task.");
  const remainingPrivateVerifications =
    await getRemainingPrivateVerifications();

  if (remainingPrivateVerifications.length === 0) {
    Logger.info("[private instructions] No pending private profile. Stopping.");
    return;
  }

  Logger.info(
    `[private instructions] ${remainingPrivateVerifications.length} pending private profiles found.`,
  );

  for await (const verification of remainingPrivateVerifications) {
    Logger.info(`[private instructions] #${verification.username}`);

    const isFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
      verification.username,
    );

    if (!isFollowedByHevyBot) {
      await followUserOnHevy(verification.username);

      if (!verification.privateInstructionsSent) {
        await sendPrivateAccountInstructionsDM(verification.userDiscordId);
        await markPrivateInstructionsAsSent(verification.userDiscordId);
      }
    } else {
      await setIsFollowedByHevyBot(verification.userDiscordId, true);
      if (!verification.privateInstructionsSent) {
        // TODO : make this clearer
        // currently this send also a "yay you did it message" after checking the verification
        // this function name is not explicit
        await sendPrivateAccountInstructionsDM(verification.userDiscordId);
        // TODO : better way and text for validation ?
        await markPrivateInstructionsAsSent(verification.userDiscordId); // TO SEND validation
      }
    }
  }
};
