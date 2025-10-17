/*
  Warnings:

  - You are about to drop the column `orignalInteractionId` on the `HevyVerification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."HevyVerification" DROP COLUMN "orignalInteractionId",
ADD COLUMN     "originalInteractionChannelId" TEXT,
ADD COLUMN     "originalInteractionId" TEXT;
