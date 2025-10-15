/*
  Warnings:

  - You are about to drop the column `userHevyUsername` on the `HevyUserVerification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userDiscordId]` on the table `HevyUserVerification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userDiscordId` to the `HevyUserVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."HevyUserVerification" DROP CONSTRAINT "HevyUserVerification_userHevyUsername_fkey";

-- DropIndex
DROP INDEX "public"."HevyUserVerification_userHevyUsername_key";

-- AlterTable
ALTER TABLE "public"."HevyUserVerification" DROP COLUMN "userHevyUsername",
ADD COLUMN     "userDiscordId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "HevyUserVerification_userDiscordId_key" ON "public"."HevyUserVerification"("userDiscordId");

-- AddForeignKey
ALTER TABLE "public"."HevyUserVerification" ADD CONSTRAINT "HevyUserVerification_userDiscordId_fkey" FOREIGN KEY ("userDiscordId") REFERENCES "public"."User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
