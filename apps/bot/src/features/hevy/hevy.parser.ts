import { HevyWorkout } from "./hevy.types";

export const getWorkoutUrl = (workout: HevyWorkout) =>
  `https://hevy.com/workout/${workout.short_id}`;
