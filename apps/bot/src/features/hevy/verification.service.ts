import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@repo/db";
import { Logger } from "commandkit";
import {
  followUserOnHevy,
  getUserProfile,
  getWorkoutComments,
} from "./hevy.api";
import verificationConfig from "@/config/verification.config";
import dayjs from "dayjs";
import {
  getUserByDiscordId,
  setIsHevyProfilePrivate,
  setUserHevyUsername,
} from "./hevy.service";
import {
  sendPrivateAccountInstructionsDM,
  sendSuccessfullVerificationDM,
} from "../core/user.service";
import verification from "@/app/tasks/verification";
import { HevyUserVerificationWithUser } from "./verification.types";

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

export const insertVerificationCode = async (
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
      userVerification = await prisma.hevyUserVerification.create({
        data: {
          verificationCode: verificationCode,
          workoutId: verificationConfig.workoutShortId,
          userDiscordId: discordId,
          userHevyUsername: hevyUsername,
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

const markVerificationAsDone = async (
  verification: HevyUserVerificationWithUser,
) => {
  await prisma.hevyUserVerification.updateMany({
    where: {
      userHevyUsername: verification.userHevyUsername,
      userDiscordId: verification.userDiscordId,
      status: "pending",
    },
    data: {
      status: "verified",
    },
  });
};

const getVerificationCodesExpiryDate = () =>
  dayjs()
    .subtract(verificationConfig.codeLifeSpanInDays as number, "days")
    .toDate();

export const getUserLatestPendingVerification = async (
  discordId: string,
  hevyUsername: string,
) => {
  const expiryDate = getVerificationCodesExpiryDate();
  return await prisma.hevyUserVerification.findFirst({
    where: {
      userDiscordId: discordId,
      userHevyUsername: hevyUsername,
      status: "pending",
      createdAt: {
        gt: expiryDate,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getRemainingPendingVerifications = async (): Promise<
  HevyUserVerificationWithUser[]
> => {
  const expiryDate = getVerificationCodesExpiryDate();

  return await prisma.hevyUserVerification.findMany({
    where: {
      status: "pending",
      createdAt: {
        gt: expiryDate,
      },
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
  let hevyUserVerification = await getUserLatestPendingVerification(
    discordId,
    hevyUsername,
  );

  if (hevyUserVerification == null) {
    Logger.info(`No verification for this user. Creating one.`);
    hevyUserVerification =
      (await insertVerificationCode(discordId, hevyUsername)) ?? null;
  } else {
    Logger.info(`User verification already exists. Returning it.`);
  }

  return hevyUserVerification;
};

export const isUserVerified = async (
  discordId: string,
  hevyUsername: string,
) => {
  return await prisma.user.findUnique({
    where: {
      discordId,
      hevyUsername,
      hevyUserVerifications: {
        some: {
          userDiscordId: discordId,
          userHevyUsername: hevyUsername,
        },
      },
    },
  });
};

export const getVerificationWorkoutComments = async () => {
  return await getWorkoutComments(verificationConfig.workoutShortId);
};

export const isVerificationCodePostedOnHevy = async (
  verification: HevyUserVerificationWithUser,
) => {
  const comments = await getVerificationWorkoutComments();

  const correspondingComment = comments.find(
    (comment) =>
      comment.comment.trim() === verification.verificationCode &&
      comment.username === verification.userHevyUsername,
  );

  if (!correspondingComment) return false;

  return true;
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
      `[verification] Handling verification : ${verification.userHevyUsername} - code: ${verification.verificationCode} - date: ${verification.createdAt}`,
    );
    const isVerificationDone =
      await isVerificationCodePostedOnHevy(verification);

    Logger.info(
      `[verification] Verification #${verification.verificationCode} done? ${isVerificationDone}`,
    );

    if (isVerificationDone) {
      await markVerificationAsDone(verification);
      await setUserHevyUsername(
        verification.userDiscordId,
        verification.userHevyUsername,
      );
      const hevyProfile = await getUserProfile(verification.userHevyUsername);
      await setIsHevyProfilePrivate(
        verification.userDiscordId,
        hevyProfile.private_profile,
      );
      await sendSuccessfullVerificationDM(verification);

      if (hevyProfile.private_profile) {
        Logger.info(
          `[verification] #${verification.verificationCode} : private profile.`,
        );

        followUserOnHevy(verification.userHevyUsername);
        sendPrivateAccountInstructionsDM(verification.userDiscordId);
      }
    }
  }
};
