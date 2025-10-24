import { executeWorkoutFetcherTask } from "@/features/workout/fetcher/workoutFetcher.service";
import { task } from "@commandkit/tasks";

export default task({
  name: "new-workout-fetcher",
  schedule: "*/1 * * * *",
  immediate: true,
  async execute(_ctx) {
    console.log(`Executing task: new-workout-fetcher`);

    await executeWorkoutFetcherTask();
  },
});
