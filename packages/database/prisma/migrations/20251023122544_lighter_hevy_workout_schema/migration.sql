/*
  Warnings:

  - You are about to drop the column `is_liked_by_user` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `like_images` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `preview_workout_likes` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the `HevyExercise` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HevyPR` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HevySet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HevyWorkoutComment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."HevyExercise" DROP CONSTRAINT "HevyExercise_workoutId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HevyPR" DROP CONSTRAINT "HevyPR_hevySet_personalRecordsId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HevyPR" DROP CONSTRAINT "HevyPR_hevySet_prsId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HevySet" DROP CONSTRAINT "HevySet_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HevyWorkout" DROP CONSTRAINT "HevyWorkout_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HevyWorkoutComment" DROP CONSTRAINT "HevyWorkoutComment_workoutId_fkey";

-- AlterTable
ALTER TABLE "public"."HevyWorkout" DROP COLUMN "is_liked_by_user",
DROP COLUMN "like_images",
DROP COLUMN "preview_workout_likes",
ADD COLUMN     "exercises" JSONB[],
ADD COLUMN     "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."HevyExercise";

-- DropTable
DROP TABLE "public"."HevyPR";

-- DropTable
DROP TABLE "public"."HevySet";

-- DropTable
DROP TABLE "public"."HevyWorkoutComment";

-- DropEnum
DROP TYPE "public"."PRType";

-- DropEnum
DROP TYPE "public"."SetIndicator";

-- AddForeignKey
ALTER TABLE "public"."HevyWorkout" ADD CONSTRAINT "HevyWorkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
