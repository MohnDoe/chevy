const schedule = process.env.CHEVY_AUTO_SHARE_TASK_SCHEDULE;
if (!schedule) {
  throw new Error(
    "Missing environment variable: CHEVY_AUTO_SHARE_TASK_SCHEDULE"
  );
}

export default {
  task: {
    schedule,
    name: "auto-share-workouts",
  },
};
