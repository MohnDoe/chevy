import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@repo/db";
import { Logger } from "commandkit";
import { getWorkoutComments } from "./hevy.api";
import { HevyUserVerification } from "../../../../../packages/database/generated/prisma";

const VERIFICATION_CODE_LENGTH = 12;
const WORKOUT_SHORT_ID = "XgezVT8rCLT";

export const generateVerificationCode = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

export const insertVerificationCode = async (discordId: string) => {
  let verificationCode = "";
  let isCodeUnique = false;
  let userVerification = null;

  while (!isCodeUnique) {
    verificationCode = generateVerificationCode(VERIFICATION_CODE_LENGTH);

    try {
      userVerification = await prisma.hevyUserVerification.create({
        data: {
          verificationCode: verificationCode,
          workoutId: WORKOUT_SHORT_ID,
          User: {
            connect: {
              discordId,
            },
          },
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

export const findOrCreateUserVerification = async (discordId: string) => {
  let hevyUserVerification = await prisma.hevyUserVerification.findFirst({
    where: {
      User: {
        discordId,
      },
    },
  });

  if (!hevyUserVerification) {
    hevyUserVerification = (await insertVerificationCode(discordId)) ?? null;
  }

  return hevyUserVerification;
};

export const isUserVerified = async (hevyUsername: string) => {
  return await prisma.user.findUnique({
    where: {
      hevyUsername,
      hevyUserVerification: {
        status: "verified",
      },
    },
  });
};

export const getVerificationWorkoutComments = async () => {
  return await getWorkoutComments(WORKOUT_SHORT_ID);
};

export const findAssociatedHevyUsername = async (code: string) => {
  const comments = await getVerificationWorkoutComments();

  const correspondingComment = comments.find(
    (comment) => comment.comment.trim() === code,
  );

  if (!correspondingComment) return null;

  return correspondingComment.username;
};
