/*
  Warnings:

  - You are about to drop the column `userHevyUsername` on the `HevyVerification` table. All the data in the column will be lost.
  - You are about to drop the column `hevyProfilePrivate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hevyUsername` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isFollowedByHevyBot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastBotFollowRequest` on the `User` table. All the data in the column will be lost.
  - Added the required column `username` to the `HevyVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."User_discordId_hevyUsername_key";

-- DropIndex
DROP INDEX "public"."User_hevyUsername_key";

-- AlterTable
ALTER TABLE "public"."HevyVerification" DROP COLUMN "userHevyUsername",
ADD COLUMN     "followedByBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privateProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "hevyProfilePrivate",
DROP COLUMN "hevyUsername",
DROP COLUMN "isFollowedByHevyBot",
DROP COLUMN "lastBotFollowRequest";
