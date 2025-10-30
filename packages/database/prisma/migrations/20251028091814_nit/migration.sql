/*
  Warnings:

  - You are about to drop the column `data` on the `HevyWorkout` table. All the data in the column will be lost.
  - Added the required column `appleWatch` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedVolumeKg` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `includeWarmupSets` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `index` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isBiometricsPublic` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isPrivate` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastFetch` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `media` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nthWorkout` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortId` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verified` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wearosWatch` to the `HevyWorkout` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."HevyWorkout_id_key";

-- AlterTable
ALTER TABLE "public"."HevyWorkout" DROP COLUMN "data",
ADD COLUMN     "appleWatch" BOOLEAN NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "endTime" INTEGER NOT NULL,
ADD COLUMN     "estimatedVolumeKg" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "exercises" JSONB[],
ADD COLUMN     "imageUrls" JSONB[],
ADD COLUMN     "includeWarmupSets" BOOLEAN NOT NULL,
ADD COLUMN     "index" INTEGER NOT NULL,
ADD COLUMN     "isBiometricsPublic" BOOLEAN NOT NULL,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL,
ADD COLUMN     "lastFetch" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "media" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nthWorkout" INTEGER NOT NULL,
ADD COLUMN     "routineId" TEXT,
ADD COLUMN     "shortId" TEXT NOT NULL,
ADD COLUMN     "startTime" INTEGER NOT NULL,
ADD COLUMN     "verified" BOOLEAN NOT NULL,
ADD COLUMN     "wearosWatch" BOOLEAN NOT NULL;
