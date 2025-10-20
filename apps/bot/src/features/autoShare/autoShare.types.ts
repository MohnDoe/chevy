import { Prisma } from "@repo/db";

export type ServerWithAutoShareConfig = Prisma.ServerGetPayload<{
  where: {
    ServerAutoShareConfig: {
      enabled: true;
      channelId: {
        not: null;
      };
    };
  };
  include: { ServerAutoShareConfig: true };
}>;

export type ShareWithWorkout = Prisma.ShareGetPayload<{
  include: { HevyWorkout: true };
}>;
