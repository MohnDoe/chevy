import { HevyExercise } from "./exercise.type";

export interface HevyWorkout {
  id: string;
  name: string;
  index: number;
  media: any[];
  user_id: string;
  comments: any[];
  end_time: number;
  short_id: string;
  username: string;
  verified: boolean;
  exercises: HevyExercise[];
  created_at: Date;
  image_urls: string[];
  is_private: boolean;
  like_count: number;
  routine_id?: string;
  start_time: number;
  updated_at: Date;
  apple_watch: boolean;
  description: string;
  like_images: string[];
  nth_workout: number;
  wearos_watch: boolean;
  comment_count: number;
  profile_image: string;
  estimated_volume_kg: number;
  include_warmup_sets: boolean;
  is_biometrics_public: boolean;
  preview_workout_likes: { username: string; profile_pic: string }[];
  is_liked_by_user: boolean;
}
