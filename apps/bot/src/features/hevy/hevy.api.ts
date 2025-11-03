import axios from "axios";
import dotenv from "dotenv";
import { cacheLife, cacheTag } from "@commandkit/cache";
import { HevyWorkout, HevyWorkoutComment } from "./hevy.types";
import { Logger } from "commandkit";

dotenv.config();

const HEVY_API_URL = "https://api.hevyapp.com";
const authToken = process.env.BOT_ON_HEVY_AUTH_TOKEN;
if (!authToken) {
  throw new Error("BOT_ON_HEVY_AUTH_TOKEN environment variable is missing.");
}
const HevyBotAPIClient = axios.create({
  baseURL: HEVY_API_URL,
  headers: {
    "x-api-key": "shelobs_hevy_web",
    "auth-token": authToken,
  },
});

export const getUserLatestWorkout = async (username: string) => {
  const workouts = await getUserWorkouts(username, 1, 1);
  if (workouts!.length === 0) {
    console.warn(`No workouts found for user ${username}`);
    return null;
  }
  return workouts[0];
};

export const checkIfUserFollowingBot = async (userHevyUsername: string) => {
  const userProfile = await getUserProfile(userHevyUsername);

  if (!userProfile) return false;

  return userProfile.is_followed_by_requester;
};

export const checkIfUserUserIsFollowedByBot = async (
  userHevyUsername: string,
) => {
  const userProfile = await getUserProfile(userHevyUsername);

  if (!userProfile) return false;

  return userProfile.following_status == "following";
};
export const followUserOnHevy = async (userHevyUsername: string) => {
  Logger.info(`[Hevy API] Sending follow request to ${userHevyUsername}`);
  const userProfile = await getUserProfile(userHevyUsername);

  if (!userProfile) return;

  if (
    userProfile.following_status == "following" ||
    userProfile.following_status == "requested"
  ) {
    Logger.info(
      `[Hevy API] User ${userHevyUsername} is already followed or request is pending.`,
    );
    return;
  }

  // TODO: add rate limit
  try {
    await HevyBotAPIClient.post(`/follow`, {
      username: userHevyUsername,
    });
  } catch (error) {
    Logger.error(
      `[Hevy API] Error following user ${userHevyUsername} : ${error}`,
    );
  }

  return;
};

export const getUserProfile = async (username: string) => {
  "use cache";
  cacheLife("5m");
  cacheTag(`profile:username:${username}`);
  try {
    const hevyResponse = await HevyBotAPIClient.get(
      `/user_profile/${username}`,
    );
    return hevyResponse.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getWorkout = async (
  workoutShortId: string,
): Promise<HevyWorkout> => {
  "use cache";
  cacheLife("1m");
  cacheTag(`workout:shortId:${workoutShortId}`);
  try {
    const hevyResponse = await HevyBotAPIClient.get(
      `/workout/${workoutShortId}`,
    );
    return hevyResponse.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getUserWorkouts = async (
  username: string,
  page = 1,
  perPage = 10,
) => {
  "use cache";
  cacheLife("15m");
  cacheTag(`workouts:user:username:${username}`);
  try {
    const hevyResponse = await HevyBotAPIClient.get(
      `${HEVY_API_URL}/user_workouts_paged?username=${username.toLowerCase()}&limit=${perPage}&offset=${
        (page - 1) * perPage
      }`,
    );

    return hevyResponse.data.workouts as HevyWorkout[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getWorkoutComments = async (
  workoutShortId: string,
): Promise<HevyWorkoutComment[]> => {
  const workout = await getWorkout(workoutShortId);

  if (workout) return workout.comments;

  return [];
};

export const deleteComment = async (commentId: HevyWorkoutComment["id"]) => {
  Logger.info(`[Hevy API] Deleting comment: ${commentId}`);
  try {
    await HevyBotAPIClient.delete(`/workout_comment/${commentId}`);
    Logger.info(`[Hevy API] Comment deleted: ${commentId}`);
  } catch (error) {
    Logger.warn(`[Hevy API] Error deleting comment ${commentId} : ${error}`);
  }
};
