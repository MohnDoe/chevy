/*
  Warnings:

  - You are about to drop the `HevyUserVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."UserVerificationStatus" ADD VALUE 'unlinked';

-- DropForeignKey
ALTER TABLE "public"."HevyUserVerification" DROP CONSTRAINT "HevyUserVerification_userDiscordId_fkey";

-- DropTable
DROP TABLE "public"."HevyUserVerification";

-- CreateTable
CREATE TABLE "public"."HevyVerification" (
    "id" TEXT NOT NULL,
    "lastCheck" TIMESTAMP(3),
    "workoutId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "status" "public"."UserVerificationStatus" NOT NULL DEFAULT 'pending',
    "userDiscordId" TEXT NOT NULL,
    "userHevyUsername" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HevyVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HevyVerification_id_key" ON "public"."HevyVerification"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HevyVerification_verificationCode_key" ON "public"."HevyVerification"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "HevyVerification_userDiscordId_key" ON "public"."HevyVerification"("userDiscordId");

-- AddForeignKey
ALTER TABLE "public"."HevyVerification" ADD CONSTRAINT "HevyVerification_userDiscordId_fkey" FOREIGN KEY ("userDiscordId") REFERENCES "public"."User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
