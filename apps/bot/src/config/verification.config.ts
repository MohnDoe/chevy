const schedule = process.env.CHEVY_VERIFICATION_TASK_SCHEDULE;
const workoutShortId = process.env.CHEVY_VERIFICATION_WORKOUT_SHORT_ID;
if (!schedule) {
  throw new Error(
    "Missing environment variable: CHEVY_VERIFICATION_TASK_SCHEDULE",
  );
}
if (!workoutShortId) {
  throw new Error(
    "Missing environment variable: CHEVY_VERIFICATION_WORKOUT_SHORT_ID",
  );
}
export default {
  task: {
    schedule,
    name: "verification",
  },
  codeLength: process.env.CHEVY_CODE_LENGTH || 12,
  workoutShortId,
  codeLifeSpanInDays: process.env.CHEVY_VERIFICATION_CODE_LIFESPAN_DAYS || 1,
};
