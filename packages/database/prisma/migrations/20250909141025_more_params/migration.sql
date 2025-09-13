/*
  Warnings:

  - You are about to drop the column `isVerifiedOnHevy` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "isVerifiedOnHevy",
ADD COLUMN     "hevyProfilePrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFollowedByHevyBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFollowingHevyBot" BOOLEAN NOT NULL DEFAULT false;
