import { prisma } from "./client";

(async () => {
  await prisma.$disconnect();
})();
