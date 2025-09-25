/*
  Warnings:

  - The primary key for the `Server` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discordId` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Server` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[guildId]` on the table `Server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guildId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AutoShareWorkoutFormat" AS ENUM ('line', 'compact', 'detailed');

-- DropIndex
DROP INDEX "public"."Server_discordId_key";

-- AlterTable
ALTER TABLE "public"."Server" DROP CONSTRAINT "Server_pkey",
DROP COLUMN "discordId",
DROP COLUMN "id",
DROP COLUMN "settings",
ADD COLUMN     "guildId" TEXT NOT NULL,
ADD CONSTRAINT "Server_pkey" PRIMARY KEY ("guildId");

-- CreateTable
CREATE TABLE "public"."ServerAutoShareConfig" (
    "guildId" TEXT NOT NULL,
    "isEnable" BOOLEAN NOT NULL DEFAULT false,
    "channelId" TEXT,
    "workoutFormat" "public"."AutoShareWorkoutFormat" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerAutoShareConfig_pkey" PRIMARY KEY ("guildId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerAutoShareConfig_guildId_key" ON "public"."ServerAutoShareConfig"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_guildId_key" ON "public"."Server"("guildId");

-- AddForeignKey
ALTER TABLE "public"."ServerAutoShareConfig" ADD CONSTRAINT "ServerAutoShareConfig_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Server"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
