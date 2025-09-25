import { prisma } from "@repo/db";

export const upsertServer = async (guildId: string) => {
  return await prisma.server.upsert({
    where: {
      guildId,
    },
    create: {
      guildId,
    },
    update: {},
  });
};
