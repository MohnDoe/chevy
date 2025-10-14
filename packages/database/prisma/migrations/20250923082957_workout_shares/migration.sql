-- CreateEnum
CREATE TYPE "public"."ShareReason" AS ENUM ('commandUsed', 'autoShared');

-- AlterTable
ALTER TABLE "public"."User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "public"."Workout" (
    "id" TEXT NOT NULL,
    "hevyWorkoutId" TEXT NOT NULL,
    "hevyWorkoutShortId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Server" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "settings" JSONB,
    "ownerId" UUID NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Share" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelType" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "reason" "public"."ShareReason" NOT NULL,
    "sharerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workout_hevyWorkoutId_key" ON "public"."Workout"("hevyWorkoutId");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_hevyWorkoutShortId_key" ON "public"."Workout"("hevyWorkoutShortId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_discordId_key" ON "public"."Server"("discordId");

-- AddForeignKey
ALTER TABLE "public"."Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Server" ADD CONSTRAINT "Server_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_sharerId_fkey" FOREIGN KEY ("sharerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
