/*
  Warnings:

  - You are about to drop the column `workoutId` on the `Share` table. All the data in the column will be lost.
  - You are about to drop the `Workout` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SetIndicator" AS ENUM ('normal', 'warmup', 'dropset', 'failure');

-- CreateEnum
CREATE TYPE "public"."PRType" AS ENUM ('best_volume', 'best_1rm', 'best_distance', 'best_weight');

-- DropForeignKey
ALTER TABLE "public"."Share" DROP CONSTRAINT "Share_workoutId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Workout" DROP CONSTRAINT "Workout_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Share" DROP COLUMN "workoutId",
ADD COLUMN     "hevyWorkoutId" TEXT;

-- DropTable
DROP TABLE "public"."Workout";

-- CreateTable
CREATE TABLE "public"."HevyWorkout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "media" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "end_time" INTEGER NOT NULL,
    "short_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "image_urls" JSONB NOT NULL,
    "is_private" BOOLEAN NOT NULL,
    "like_count" INTEGER NOT NULL,
    "routine_id" TEXT,
    "start_time" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "apple_watch" BOOLEAN NOT NULL,
    "description" TEXT NOT NULL,
    "like_images" JSONB NOT NULL,
    "nth_workout" INTEGER NOT NULL,
    "wearos_watch" BOOLEAN NOT NULL,
    "comment_count" INTEGER NOT NULL,
    "profile_image" TEXT NOT NULL,
    "estimated_volume_kg" DOUBLE PRECISION NOT NULL,
    "include_warmup_sets" BOOLEAN NOT NULL,
    "is_biometrics_public" BOOLEAN NOT NULL,
    "preview_workout_likes" JSONB NOT NULL,
    "is_liked_by_user" BOOLEAN NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "HevyWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HevyExercise" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "index" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "exercise_template_id" TEXT NOT NULL,
    "supersets_id" INTEGER,
    "title" TEXT NOT NULL,
    "de_title" TEXT,
    "es_title" TEXT,
    "fr_title" TEXT,
    "it_title" TEXT,
    "ja_title" TEXT,
    "ko_title" TEXT,
    "pt_title" TEXT,
    "ru_title" TEXT,
    "tr_title" TEXT,
    "zh_cn_title" TEXT,
    "zh_tw_title" TEXT,
    "priority" INTEGER NOT NULL,
    "media_type" TEXT,
    "superset_id" INTEGER,
    "muscle_group" TEXT NOT NULL,
    "rest_seconds" INTEGER NOT NULL,
    "exercise_type" TEXT NOT NULL,
    "other_muscles" JSONB NOT NULL,
    "thumbnail_url" TEXT,
    "equipment_category" TEXT NOT NULL,
    "volume_doubling_enabled" BOOLEAN NOT NULL,
    "custom_exercise_image_url" TEXT,
    "workoutId" TEXT NOT NULL,

    CONSTRAINT "HevyExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HevySet" (
    "id" TEXT NOT NULL,
    "rpe" DOUBLE PRECISION,
    "reps" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "indicator" "public"."SetIndicator",
    "weight_kg" DOUBLE PRECISION,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "custom_metric" JSONB,
    "distance_meters" DOUBLE PRECISION,
    "duration_seconds" DOUBLE PRECISION,
    "exerciseId" TEXT NOT NULL,

    CONSTRAINT "HevySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HevyPR" (
    "id" TEXT NOT NULL,
    "type" "public"."PRType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "hevySet_prsId" TEXT,
    "hevySet_personalRecordsId" TEXT,

    CONSTRAINT "HevyPR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HevyWorkoutComment" (
    "id" SERIAL NOT NULL,
    "comment" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "like_count" INTEGER NOT NULL,
    "profile_pic" TEXT NOT NULL,
    "is_liked_by_user" BOOLEAN NOT NULL,
    "workoutId" TEXT NOT NULL,

    CONSTRAINT "HevyWorkoutComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HevyWorkout_id_key" ON "public"."HevyWorkout"("id");

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_hevyWorkoutId_fkey" FOREIGN KEY ("hevyWorkoutId") REFERENCES "public"."HevyWorkout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HevyWorkout" ADD CONSTRAINT "HevyWorkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HevyExercise" ADD CONSTRAINT "HevyExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."HevyWorkout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HevySet" ADD CONSTRAINT "HevySet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."HevyExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HevyPR" ADD CONSTRAINT "HevyPR_hevySet_prsId_fkey" FOREIGN KEY ("hevySet_prsId") REFERENCES "public"."HevySet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HevyPR" ADD CONSTRAINT "HevyPR_hevySet_personalRecordsId_fkey" FOREIGN KEY ("hevySet_personalRecordsId") REFERENCES "public"."HevySet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HevyWorkoutComment" ADD CONSTRAINT "HevyWorkoutComment_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."HevyWorkout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
