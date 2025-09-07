import dotenv from "dotenv";
import { HevyWorkout } from "../types/hevy/workout.type";
dotenv.config();

const HEVY_API_URL = "https://api.hevyapp.com";

const FETCH_HEADERS = {
  "x-api-key": "shelobs_hevy_web",
  "auth-token": process.env.CHEVY_ON_HEVY_AUTH_TOKEN!,
};


export const getUserLatestWorkout = async (username: string) => {
  const workouts = await getUserWorkouts(username, 1, 1);
  if (workouts!.length === 0) {
    console.warn(`No workouts found for user ${username}`);
    return null;
  }
  return workouts[0];
};

export const getUserWorkouts = async (
  username: string,
  page = 1,
  perPage = 50
) => {
  const hevyResponse = await fetch(
    `${HEVY_API_URL}/user_workouts_paged?username=${username}&limit=${perPage}&offset=${
      (page - 1) * perPage
    }`,
    {
      headers: FETCH_HEADERS,
    }
  );

  if (!hevyResponse.ok) {
    console.error(
      `Hevy API returned ${hevyResponse.status} for user workouts of ${username}`
    );
    return [];
  }
  const hevyData = await hevyResponse.json();
  if (hevyData === null) {
    return [];
  }
  return hevyData.workouts as HevyWorkout[];
};
