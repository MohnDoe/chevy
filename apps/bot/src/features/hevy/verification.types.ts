import { Prisma } from "@repo/db";

export type HevyUserVerificationWithUser = Prisma.HevyVerificationGetPayload<{
  include: {
    User: true;
  };
}>;
