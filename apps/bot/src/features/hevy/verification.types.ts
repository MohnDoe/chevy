import { Prisma } from "../../../../../packages/database/generated/prisma";

export type HevyUserVerificationWithUser = Prisma.HevyVerificationGetPayload<{
  include: {
    User: true;
  };
}>;
