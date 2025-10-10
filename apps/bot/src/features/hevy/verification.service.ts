import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@repo/db";
import { Logger } from "commandkit";
import { getWorkoutComments } from "./hevy.api";
import verificationConfig from "@/config/verification.config";
import dayjs from "dayjs";

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
  let verificationCode = "";
  let isCodeUnique = false;
  let userVerification = null;

  while (!isCodeUnique) {
    verificationCode = generateVerificationCode(
      verificationConfig.codeLength as number,
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
      }
    }
    return userVerification;
  }
};

export const getUserLatestPendingVerification = async (
  discordId: string,
  hevyUsername: string,
) => {
  const expiryDate = dayjs()
    .subtract(verificationConfig.codeLifeSpanInDays as number, "days")
    .toDate();
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

export const findOrCreateUserVerification = async (
  discordId: string,
  hevyUsername: string,
) => {
  let hevyUserVerification = await getUserLatestPendingVerification(
    discordId,
    hevyUsername,
  );

  if (!hevyUserVerification) {
    hevyUserVerification =
      (await insertVerificationCode(discordId, hevyUsername)) ?? null;
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

export const findAssociatedHevyUsername = async (code: string) => {
  const comments = await getVerificationWorkoutComments();

  const correspondingComment = comments.find(
    (comment) => comment.comment.trim() === code,
  );

  if (!correspondingComment) return null;

  return correspondingComment.username;
};
