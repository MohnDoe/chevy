import { prisma, Server, User } from "@repo/db";
import { getUserWorkouts } from "../hevy/hevy.api";
import { getLastWorkoutCheck, updateUserLastWorkoutCheck } from "../core/user.service";
import client from "@/app";
import { HevyWorkout } from "../hevy/hevy.types";
import { toComponent } from "../workout/workout.embeds";
import { MessageFlags } from "discord.js";
import { Logger } from "commandkit";

const getEnabledServers = async (): Promise<Server[]> => {
  return await prisma.server.findMany({
    where: {
      ServerAutoShareConfig: {
        enabled: true,
      },
    },
    include: {
      ServerAutoShareConfig: true,
    },
  });
};

const shareWorkoutToDiscordServer = async (
  server: Server,
  workout: HevyWorkout
) => {
  const guild = client.guilds.cache.get(server.guildId);
  if (!guild) return;

  const serverConfig = await prisma.serverAutoShareConfig.findFirst({
    where: {
      guildId: server.guildId,
      enabled: true,
    },
  });
  if (!serverConfig?.enabled && !serverConfig?.channelId) return;

  const channel = guild.channels.cache.get(serverConfig.channelId!);
  if (!channel) return;

  const workoutComponent = await toComponent(workout, "detailed");

  if (channel.isSendable()) {
    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [workoutComponent],
    });
  }
};

const processUserWorkouts = async (user: User, server: Server) => {
  const lastWorkoutCheck = await getLastWorkoutCheck(user.id, server.guildId);


  const latestWorkouts = await getUserWorkouts(user.hevyUsername!, 1, 1);

  if (latestWorkouts.length === 0) {
    Logger.warn(`S:${server.guildId} - U:${user.hevyUsername} | No workouts found for user ${user.hevyUsername}`);
    return;
  }

  const latestWorkout = latestWorkouts[0];
  Logger.info(`S:${server.guildId} - U:${user.hevyUsername} | Latest workout for user ${user.hevyUsername}: ${latestWorkout.name} - ${latestWorkout.created_at}`);
  Logger.info(`S:${server.guildId} - U:${user.hevyUsername} | Last workout check for user ${user.hevyUsername}: ${lastWorkoutCheck}`);

  // TODO: FIX THIS
  if (
    !lastWorkoutCheck ||
    latestWorkout.created_at < lastWorkoutCheck
  ) {
    await shareWorkoutToDiscordServer(server, latestWorkout);
  } else {
    Logger.info(`S:${server.guildId} - U:${user.hevyUsername} | No new workouts for user ${user.hevyUsername}`);
  }

  await updateUserLastWorkoutCheck(user, server);
};

export const executeAutoShare = async () => {
  const enabledServers = await getEnabledServers();

  Logger.info(`Found ${enabledServers.length} enabled servers`);

  for (const server of enabledServers) {
    Logger.info(`Processing server ${server.guildId}`);
    const enabledUsers = await prisma.user.findMany({
      where: {
        UserAutoShareConfig: {
          some: {
            guildId: server.guildId,
            enabled: true,
          },
        },
      },
      include: {
        UserAutoShareConfig: true,
      },
    });
    Logger.info(`S:${server.guildId} | Found ${enabledUsers.length} enabled users in server ${server.guildId}`);

    for (const user of enabledUsers) {
      Logger.info(`S:${server.guildId} | Processing user ${user.discordId} - ${user.hevyUsername}`);
      await processUserWorkouts(user, server);
    }
  }
};
