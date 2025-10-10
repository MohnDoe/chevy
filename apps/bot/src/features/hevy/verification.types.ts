import { Prisma } from "../../../../../packages/database/generated/prisma";

export type HevyUserVerificationWithUser =
  Prisma.HevyUserVerificationGetPayload<{
    include: {
      User: true;
    };
  }>;
