/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `HevyWorkout` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shortId]` on the table `HevyWorkout` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HevyWorkout_id_key" ON "public"."HevyWorkout"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HevyWorkout_shortId_key" ON "public"."HevyWorkout"("shortId");
