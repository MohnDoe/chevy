import { HevyWorkout } from "../types/hevy/workout.type";
import axios from "axios";
import dotenv from "dotenv";

const wait = require("node:timers/promises").setTimeout;
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
  userHevyUsername: string
) => {
  const userProfile = await getUserProfile(userHevyUsername);

  if (!userProfile) return false;

  return userProfile.following_status == "following";
};

export const followUserOnHevy = async (userHevyUsername: string) => {
  console.log("following user ", userHevyUsername);
  // await HevyBotAPIClient.post(`/follow`, {
  //   username: userHevyUsername,
  // });

  await wait(1_000);

  return;
};

export const getUserProfile = async (username: string) => {
  try {
    const hevyResponse = await HevyBotAPIClient.get(
      `/user_profile/${username}`
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
  perPage = 50
) => {
  try {
    const hevyResponse = await HevyBotAPIClient.get(
      `${HEVY_API_URL}/user_workouts_paged?username=${username}&limit=${perPage}&offset=${
        (page - 1) * perPage
      }`
    );

    return hevyResponse.data.workouts as HevyWorkout[];
  } catch (error) {
    console.error(error);
    return [];
  }
};
