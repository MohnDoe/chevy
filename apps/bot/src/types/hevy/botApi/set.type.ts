import { HevyPR } from "./pr.type";

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
