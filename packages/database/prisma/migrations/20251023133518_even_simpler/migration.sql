/*
  Warnings:

  - You are about to drop the column `apple_watch` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `comment_count` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_volume_kg` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `exercises` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `image_urls` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `include_warmup_sets` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `index` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `is_biometrics_public` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `is_private` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `like_count` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `media` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `nth_workout` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `routine_id` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `short_id` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `HevyWorkout` table. All the data in the column will be lost.
  - You are about to drop the column `wearos_watch` on the `HevyWorkout` table. All the data in the column will be lost.
  - Added the required column `data` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."HevyWorkout" DROP COLUMN "apple_watch",
DROP COLUMN "comment_count",
DROP COLUMN "created_at",
DROP COLUMN "description",
DROP COLUMN "end_time",
DROP COLUMN "estimated_volume_kg",
DROP COLUMN "exercises",
DROP COLUMN "image_urls",
DROP COLUMN "include_warmup_sets",
DROP COLUMN "index",
DROP COLUMN "is_biometrics_public",
DROP COLUMN "is_private",
DROP COLUMN "like_count",
DROP COLUMN "media",
DROP COLUMN "name",
DROP COLUMN "nth_workout",
DROP COLUMN "profile_image",
DROP COLUMN "routine_id",
DROP COLUMN "short_id",
DROP COLUMN "start_time",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
DROP COLUMN "username",
DROP COLUMN "verified",
DROP COLUMN "wearos_watch",
ADD COLUMN     "data" JSONB NOT NULL;
