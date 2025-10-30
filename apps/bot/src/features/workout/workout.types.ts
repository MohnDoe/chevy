import { HevyWorkout } from "@repo/db";
import { RemoteHevyExercise, RemoteHevyWorkout } from "../hevy/hevy.types";

export interface LocalHevyWorkout
  extends Omit<HevyWorkout, "exercises" | "imageUrls"> {
  exercises: RemoteHevyExercise[];
  imageUrls: RemoteHevyWorkout["image_urls"];
}
