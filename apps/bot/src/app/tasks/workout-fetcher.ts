import { executeWorkoutFetcherTask } from "@/features/workout/fetcher/workoutFetcher.service";
import { task } from "@commandkit/tasks";

export default task({
  name: "workout-fetcher",
  schedule: "*/1 * * * *",
  immediate: true,
  async execute(_ctx) {
    console.log(`Executing task: workout-fetcher`);

    await executeWorkoutFetcherTask();
  },
});
