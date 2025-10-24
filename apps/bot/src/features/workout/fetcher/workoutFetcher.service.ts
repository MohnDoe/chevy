import { getUserWorkouts } from "@/features/hevy/hevy.api";
import { UserWithHevyVerification } from "@/features/hevy/hevy.service";
import { RemoteHevyWorkout } from "@/features/hevy/hevy.types";
import { Prisma, prisma, User } from "@repo/db";
import { Logger } from "commandkit";
import dayjs from "dayjs";

const MAX_USERS_FOR_WORKOUTS_CHECK = 10;
const MIN_LAST_WORKOUTS_CHECK_AGE_IN_MINS = 5;
const MAX_WORKOUT_AGE_IN_DAYS = 7;

const NEXT_WORKOUT_FETCH_INTERVAL_MINS = 4 * 60; // 4 hours

export const usersNeedingWorkoutsCheck = async (): Promise<
  UserWithHevyVerification[]
> => {
  console.log(
    dayjs().subtract(MIN_LAST_WORKOUTS_CHECK_AGE_IN_MINS, "minute").toDate(),
  );
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

export const updateUserLastWorkoutsCheck = async (user: User) =>
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastHevyWorkoutsCheck: new Date(),
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
  user: User,
) => {
  Logger.info(`Upserting hevy workout ${workout.id}`);
  return await prisma.hevyWorkout.upsert({
    where: {
      id: workout.id,
    },
    create: {
      id: workout.id,
      data: workout as unknown as Prisma.JsonObject,
      userId: user.id,
    },
    update: {
      data: workout as unknown as Prisma.JsonObject,
      updatedAt: new Date(),
    },
  });
};

export const executeWorkoutFetcherTask = async () => {
  Logger.info("Executing workout fetcher task");
  const users = await usersNeedingWorkoutsCheck();

  Logger.info(`Found ${users.length} users needing workouts check`);

  for await (const user of users) {
    Logger.info(`Checking user ${user.id}`);
    let latestWorkouts = await getUserWorkouts(
      user.hevyVerification!.username,
      1,
      5,
    );

    latestWorkouts = latestWorkouts.filter((workout) => {
      const shouldDelete =
        dayjs().subtract(MAX_WORKOUT_AGE_IN_DAYS, "day").toDate() <
        new Date(workout.created_at);
      return shouldDelete;
    });

    Logger.info(
      `Found ${latestWorkouts.length} recent workouts for user ${user.id}`,
    );

    if (latestWorkouts.length === 0) {
      Logger.info(`No workouts found for user ${user.id}. Stopping.`);
      return;
    }

    for await (const workout of latestWorkouts) {
      await upsertHevyWorkout(workout, user);
    }

    // when it's done
    await updateUserLastWorkoutsCheck(user);
    await setUserNextWorkoutCheck(user, latestWorkouts[0]);
  }
};
