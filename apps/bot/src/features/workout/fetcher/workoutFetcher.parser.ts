import { RemoteHevyWorkout } from "@/features/hevy/hevy.types";
import { Prisma } from "@repo/db";

export const parseWorkout = (workout: RemoteHevyWorkout) => {
  return {
    id: workout.id,
    name: workout.name,
    index: workout.index,
    media: workout.media,
    endTime: workout.end_time,
    shortId: workout.short_id,
    verified: workout.verified,
    createdAt: workout.created_at,
    imageUrls: workout.image_urls,
    isPrivate: workout.is_private,
    routineId: workout.routine_id ?? null,
    startTime: workout.start_time,
    updatedAt: workout.updated_at,
    appleWatch: workout.apple_watch,
    description: workout.description,
    nthWorkout: workout.nth_workout,
    wearosWatch: workout.wearos_watch,
    estimatedVolumeKg: workout.estimated_volume_kg,
    includeWarmupSets: workout.include_warmup_sets,
    isBiometricsPublic: workout.is_biometrics_public,
    exercises: workout.exercises.map(
      (exercise) => exercise as unknown as Prisma.InputJsonObject,
    ),
  };
};
