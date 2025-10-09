import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@repo/db";
import { Logger } from "commandkit";

const VERIFICATION_CODE_LENGTH = 12;
const WORKOUT_ID = "asdlkjsaldkjasd";

export const generateVerificationCode = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

export const insertVerificationCode = async (hevyUsername: string) => {
  let verificationCode = "";
  let isCodeUnique = false;

  while (!isCodeUnique) {
    verificationCode = generateVerificationCode(VERIFICATION_CODE_LENGTH);

    try {
      await prisma.hevyUserVerification.create({
        data: {
          verificationCode: verificationCode,
          workoutId: WORKOUT_ID,
          User: {
            connect: {
              hevyUsername,
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
  }
};
