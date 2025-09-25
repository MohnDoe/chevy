/*
  Warnings:

  - You are about to drop the column `isEnable` on the `ServerAutoShareConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ServerAutoShareConfig" DROP COLUMN "isEnable",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT false;
