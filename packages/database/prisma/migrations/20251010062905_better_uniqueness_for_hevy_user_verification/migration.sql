/*
  Warnings:

  - A unique constraint covering the columns `[discordId,hevyUsername]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userHevyUsername` to the `HevyUserVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."HevyUserVerification" DROP CONSTRAINT "HevyUserVerification_userDiscordId_fkey";

-- DropIndex
DROP INDEX "public"."HevyUserVerification_userDiscordId_key";

-- AlterTable
ALTER TABLE "public"."HevyUserVerification" ADD COLUMN     "userHevyUsername" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_hevyUsername_key" ON "public"."User"("discordId", "hevyUsername");

-- AddForeignKey
ALTER TABLE "public"."HevyUserVerification" ADD CONSTRAINT "HevyUserVerification_userDiscordId_userHevyUsername_fkey" FOREIGN KEY ("userDiscordId", "userHevyUsername") REFERENCES "public"."User"("discordId", "hevyUsername") ON DELETE RESTRICT ON UPDATE CASCADE;
