import { prisma, Server, User } from "@repo/db";
import { getUserWorkouts } from "../hevy/hevy.api";
import { updateUserLastWorkoutCheck } from "../core/user.service";
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
  guildId: string,
  workout: HevyWorkout
) => {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const serverConfig = await prisma.serverAutoShareConfig.findFirst({
    where: {
      guildId,
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
  const latestWorkouts = await getUserWorkouts(user.hevyUsername!, 1, 1);

  if (latestWorkouts.length === 0) {
    console.warn(`No workouts found for user ${user.hevyUsername}`);
    return;
  }

  const latestWorkout = latestWorkouts[0];
  Logger.info(`Latest workout: ${latestWorkout.name}`);

  console.log(latestWorkout.created_at);

  if (
    !user.lastWorkoutCheck ||
    latestWorkout.created_at < user.lastWorkoutCheck
  ) {
    await shareWorkoutToDiscordServer(server.guildId, latestWorkout);
  }

  await updateUserLastWorkoutCheck(user.discordId);
};

export const executeAutoShare = async () => {
  Logger.info("Executing auto share.");
  const enabledServers = await getEnabledServers();

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

    for (const user of enabledUsers) {
      Logger.info(`Processing user ${user.discordId} - ${user.hevyUsername}`);
      await processUserWorkouts(user, server);
    }
  }
};
