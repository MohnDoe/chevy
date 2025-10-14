/*
  Warnings:

  - You are about to drop the column `lastWorkoutCheck` on the `UserAutoShareConfig` table. All the data in the column will be lost.
  - You are about to drop the column `lastWorkoutId` on the `UserAutoShareConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastWorkoutCheck" TIMESTAMP(3),
ADD COLUMN     "lastWorkoutId" TEXT;

-- AlterTable
ALTER TABLE "public"."UserAutoShareConfig" DROP COLUMN "lastWorkoutCheck",
DROP COLUMN "lastWorkoutId";
