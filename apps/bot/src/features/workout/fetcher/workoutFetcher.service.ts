import * as HevyAPI from "@/features/hevy/hevy.api";
import { UserWithHevyVerification } from "@/features/hevy/hevy.service";
import { RemoteHevyWorkout } from "@/features/hevy/hevy.types";
import { prisma, User } from "@repo/db";
import { Logger } from "commandkit";
import dayjs from "dayjs";
import { parseWorkout } from "./workoutFetcher.parser";

const MAX_USERS_FOR_WORKOUTS_CHECK = 10;
const MIN_LAST_WORKOUTS_CHECK_AGE_IN_MINS = 5;
const MAX_WORKOUT_AGE_FOR_BATCH_UPDATE_IN_DAYS = 7;

export const WORKOUT_STALENESS_IN_MINS = 1 * 60; // 1 hour

const NEXT_WORKOUT_FETCH_INTERVAL_MINS = 4 * 60; // 4 hours

export const usersNeedingWorkoutsCheck = async (): Promise<
  UserWithHevyVerification[]
> => {
  return prisma.user.findMany({
    take: MAX_USERS_FOR_WORKOUTS_CHECK,
    orderBy: {
      lastHevyWorkoutsCheck: "asc",
    },
    where: {
      OR: [
        {
          AND: [
            {
              lastHevyWorkoutsCheck: {
                lte: dayjs()
                  .add(MIN_LAST_WORKOUTS_CHECK_AGE_IN_MINS, "minute")
                  .toDate(),
              },
            },
            {
              OR: [
                { nextWorkoutFetch: { lte: new Date() } },
                {
                  nextWorkoutFetch: null,
                },
              ],
            },
          ],
        },
        {
          lastHevyWorkoutsCheck: null,
        },
      ],
      hevyVerification: {
        status: "verified",
      },
    },
    include: {
      hevyVerification: true,
    },
  });
};

export const updateUserLastWorkoutsCheck = async (
  user: User,
  newDate = new Date(),
) =>
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastHevyWorkoutsCheck: newDate,
    },
  });

export const setUserNextWorkoutCheck = async (
  user: User,
  mostRecentWorkout: RemoteHevyWorkout,
) =>
  await prisma.user.update({
    where: { id: user.id },
    data: {
      nextWorkoutFetch: dayjs(mostRecentWorkout.created_at)
        .add(NEXT_WORKOUT_FETCH_INTERVAL_MINS, "minute")
        .toDate(),
    },
  });

export const upsertHevyWorkout = async (
  workout: RemoteHevyWorkout,
  user?: User,
) => {
  Logger.info(`[workout-fetcher] Upserting hevy workout ${workout.id}`);
  return await prisma.hevyWorkout.upsert({
    where: {
      id: workout.id,
    },
    create: {
      ...parseWorkout(workout),
      userId: user?.id,
    },
    update: {
      ...parseWorkout(workout),
      lastFetch: new Date(),
      userId: user?.id,
    },
  });
};

export const shouldUpdateWorkout = (workout: RemoteHevyWorkout) =>
  dayjs().subtract(MAX_WORKOUT_AGE_FOR_BATCH_UPDATE_IN_DAYS, "day").toDate() <
  new Date(workout.created_at);

export const executeWorkoutFetcherTask = async () => {
  Logger.info("[workout-fetcher] Executing workout fetcher task");
  const users = await usersNeedingWorkoutsCheck();

  Logger.info(
    `[workout-fetcher] Found ${users.length} users needing workouts check`,
  );

  for await (const user of users) {
    Logger.info(`[workout-fetcher] Checking user ${user.id}`);
    let latestWorkouts = await HevyAPI.getUserWorkouts(
      user.hevyVerification!.username,
      1,
      5,
    );

    Logger.info(
      `[workout-fetcher] Found ${latestWorkouts.length} workouts for user ${user.id}`,
    );

    latestWorkouts = latestWorkouts.filter((workout) => {
      // should skip workouts older than MAX_WORKOUT_AGE_IN_DAYS
      return shouldUpdateWorkout(workout);
    });

    if (latestWorkouts.length === 0) {
      Logger.info(
        `[workout-fetcher] No recent workouts found for user ${user.id}. Stopping.`,
      );
      return;
    }

    Logger.info(
      `[workout-fetcher] Found ${latestWorkouts.length} recent workouts for user ${user.id}`,
    );
    for await (const workout of latestWorkouts) {
      await upsertHevyWorkout(workout, user);
    }

    // when it's done
    await updateUserLastWorkoutsCheck(user);
    await setUserNextWorkoutCheck(user, latestWorkouts[0]);
  }
};
