/*
  Warnings:

  - You are about to drop the column `hevyApiKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isFollowingHevyBot` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserVerificationStatus" AS ENUM ('verified', 'pending');

-- DropIndex
DROP INDEX "public"."User_hevyApiKey_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "hevyApiKey",
DROP COLUMN "isFollowingHevyBot";

-- CreateTable
CREATE TABLE "public"."HevyUserVerification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheck" TIMESTAMP(3),
    "workoutId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "status" "public"."UserVerificationStatus" NOT NULL DEFAULT 'pending',
    "userHevyUsername" TEXT NOT NULL,

    CONSTRAINT "HevyUserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HevyUserVerification_id_key" ON "public"."HevyUserVerification"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HevyUserVerification_userHevyUsername_key" ON "public"."HevyUserVerification"("userHevyUsername");

-- AddForeignKey
ALTER TABLE "public"."HevyUserVerification" ADD CONSTRAINT "HevyUserVerification_userHevyUsername_fkey" FOREIGN KEY ("userHevyUsername") REFERENCES "public"."User"("hevyUsername") ON DELETE RESTRICT ON UPDATE CASCADE;
