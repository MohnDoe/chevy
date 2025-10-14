/*
  Warnings:

  - Changed the type of `workoutFormat` on the `ServerAutoShareConfig` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `format` on the `Share` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."WorkoutFormat" AS ENUM ('line', 'compact', 'standard', 'detailed');

-- AlterTable
ALTER TABLE "public"."ServerAutoShareConfig" DROP COLUMN "workoutFormat",
ADD COLUMN     "workoutFormat" "public"."WorkoutFormat" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Share" DROP COLUMN "format",
ADD COLUMN     "format" "public"."WorkoutFormat" NOT NULL;

-- DropEnum
DROP TYPE "public"."AutoShareWorkoutFormat";
