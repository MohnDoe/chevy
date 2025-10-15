export interface HevySet {
  id: string;
  prs: HevyPR[];
  rpe: number | null;
  reps: number;
  index: number;
  indicator: "normal" | "warmup" | "dropset" | "failure" | null;
  weight_kg: number | null;
  completed_at: Date;
  custom_metric: any | null;
  distance_meters: number | null;
  personalRecords: HevyPR[];
  duration_seconds: number | null;
}

export interface HevyExercise {
  id: string;
  url?: string;
  index: number;
  notes: string;
  exercise_template_id: string;
  supersets_id?: number | null;
  sets: HevySet[];
  title: string;
  de_title?: string;
  es_title?: string;
  fr_title?: string;
  it_title?: string;
  ja_title?: string;
  ko_title?: string;
  pt_title?: string;
  ru_title?: string;
  tr_title?: string;
  zh_cn_title?: string;
  zh_tw_title?: string;
  priority: number;
  media_type?: string;
  superset_id?: number | null;
  muscle_group: string;
  rest_seconds: number;
  exercise_type: string;
  other_muscles: string[];
  thumbnail_url?: string | null;
  equipment_category: string;
  volume_doubling_enabled: boolean;
  custom_exercise_image_url?: string | null;
}

export interface HevyPR {
  type: "best_volume" | "best_1rm" | "best_distance" | "best_weight";
  value: number;
}

export interface HevyWorkout {
  id: string;
  name: string;
  index: number;
  media: any[];
  user_id: string;
  comments: HevyWorkoutComment[];
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

export interface HevyWorkoutComment {
  id: number;
  comment: string;
  username: string;
  verified: boolean;
  full_name: string;
  created_at: Date;
  like_count: number;
  profile_pic: string;
  is_liked_by_user: boolean;
}

export interface HevyProfile {
  username: string;
  verified: boolean;
  subscribed: boolean;
  profie_pic: string;
  full_name: string;
  workout_count: number;
  is_blocked: boolean;
  following_status: string;
  is_followed_by_requester: boolean;
  private_profile: boolean;
  follower_count: number;
  following_count: number;
  routines: any[];
  weekly_workout_durations: any[];
  mutual_followers: {
    username: string;
    profile_pic: string;
  }[];
}
