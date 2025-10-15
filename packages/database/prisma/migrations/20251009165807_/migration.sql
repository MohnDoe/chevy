/*
  Warnings:

  - A unique constraint covering the columns `[verificationCode]` on the table `HevyUserVerification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HevyUserVerification_verificationCode_key" ON "public"."HevyUserVerification"("verificationCode");
