/*
  Warnings:

  - You are about to drop the column `lastWorkoutCheck` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastWorkoutId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "lastWorkoutCheck",
DROP COLUMN "lastWorkoutId";

-- AlterTable
ALTER TABLE "public"."UserAutoShareConfig" ADD COLUMN     "lastWorkoutCheck" TIMESTAMP(3),
ADD COLUMN     "lastWorkoutId" TEXT;
