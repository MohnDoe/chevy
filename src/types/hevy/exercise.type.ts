import { HevySet } from "./set.type";

// Updated HevyExercise interface to match the provided workout exercise structure
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
