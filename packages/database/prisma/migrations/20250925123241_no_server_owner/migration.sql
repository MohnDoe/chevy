/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Server` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Server" DROP CONSTRAINT "Server_ownerId_fkey";

-- AlterTable
ALTER TABLE "public"."Server" DROP COLUMN "ownerId";
