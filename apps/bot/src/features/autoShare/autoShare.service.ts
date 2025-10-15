import client from "@/app";
import { cacheLife, cacheTag } from "@commandkit/cache";
import { prisma, ServerAutoShareConfig, User, WorkoutFormat } from "@repo/db";
import { Logger } from "commandkit";
import {
  hyperlink,
  MessageFlags,
  subtext,
  TextDisplayBuilder,
  userMention,
} from "discord.js";
import { commandMention } from "../discord/command.service";
import { getUserWorkouts, getWorkout } from "../hevy/hevy.api";
import { getWorkoutUrl } from "../hevy/hevy.parser";
import { UserWithHevyVerification } from "../hevy/hevy.service";
import { HevyWorkout } from "../hevy/hevy.types";
import { toComponent } from "../workout/workout.embeds";
import {
  AVAILABLE_AUTO_SHARE_FORMATS,
  saveWorkoutShare,
} from "../workout/workout.service";
import { ServerWithAutoShareConfig, ShareWithWorkout } from "./autoShare.types";
import dayjs from "dayjs";

const MAX_WORKOUT_AGE_IN_MINS = 60;

const getEnabledServers = async (): Promise<ServerWithAutoShareConfig[]> => {
  "use cache";
  cacheLife("1d");
  cacheTag("autoShare:enabledServers");
  return await prisma.server.findMany({
    where: {
      ServerAutoShareConfig: {
        enabled: true,
        channelId: {
          not: null,
        },
      },
    },
    include: {
      ServerAutoShareConfig: true,
    },
  });
};

const autoShareWorkoutToDiscordServer = async (
  server: ServerWithAutoShareConfig,
  user: UserWithHevyVerification,
  workout: HevyWorkout,
) => {
  const desiredFormat: WorkoutFormat =
    server.ServerAutoShareConfig!.workoutFormat;
  const format: WorkoutFormat = AVAILABLE_AUTO_SHARE_FORMATS.includes(
    desiredFormat,
  )
    ? desiredFormat
    : WorkoutFormat.compact;

  const guild = client.guilds.cache.get(server.guildId);
  if (!guild) return;

  const serverConfig = server.ServerAutoShareConfig;

  if (!serverConfig?.enabled && !serverConfig?.channelId) return;
  const channel = guild.channels.cache.get(serverConfig.channelId!);
  if (!channel) return;

  const workoutComponent = await toComponent(workout, format);
  const lineComponent = new TextDisplayBuilder().setContent(
    `${userMention(user.discordId)} just completed ${hyperlink("a workout on Hevy", getWorkoutUrl(workout), workout.name)}.`,
  );
  const prefixComponent = new TextDisplayBuilder().setContent(
    `${userMention(user.discordId)} just finished a workout on Hevy.`,
  );

  const autoShareYoursText = new TextDisplayBuilder().setContent(
    subtext(`Share yours using ${await commandMention("auto-share enable")}.`),
  );
  if (channel.isSendable()) {
    try {
      await channel.send({
        allowedMentions: {
          users: [],
        },
        flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
        components:
          format == "line"
            ? [lineComponent]
            : [prefixComponent, workoutComponent, autoShareYoursText],
      });

      saveWorkoutShare(workout, user.discordId, channel, "autoShared", format);
    } catch (error) {
      Logger.error(
        `[auto-share] S:${server.guildId} - U:${user.hevyVerification!.username} | Error sending message to channel ${serverConfig.channelId}: ${error}`,
      );
      Logger.error("[auto-share ]" + error);
    }
  } else {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.hevyVerification!.username} | Channel ${serverConfig.channelId} is not sendable.`,
    );
  }
};

const processUserWorkouts = async (
  user: UserWithHevyVerification,
  server: ServerWithAutoShareConfig,
) => {
  if (!user.hevyVerification!.username) {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.discordId} | User does not have a Hevy username configured. Skipping.`,
    );
    return;
  }

  const latestWorkouts = await getUserWorkouts(
    user.hevyVerification!.username,
    1,
    1,
  );

  if (latestWorkouts.length === 0) {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.hevyVerification!.username} | No workouts found for user ${user.hevyVerification!.username}`,
    );
    return;
  }

  const latestWorkout = await getWorkout(latestWorkouts[0].short_id);
  Logger.info(
    `[auto-share] S:${server.guildId} - U:${user.hevyVerification!.username} | Latest workout for user ${user.hevyVerification!.username}: ${latestWorkout.name} - ${latestWorkout.created_at}`,
  );

  if (
    dayjs().diff(dayjs(latestWorkout.created_at), "minute") >
    MAX_WORKOUT_AGE_IN_MINS
  ) {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.hevyVerification!.username} | Workout is too old. Skipping.`,
    );
    return;
  }

  const lastAutoSharesInServerChannel = await getUserLastAutoShares(
    user,
    server.ServerAutoShareConfig!,
  );

  if (lastAutoSharesInServerChannel.length > 0) {
    const lastAutoShare = lastAutoSharesInServerChannel[0];

    if (lastAutoShare.Workout.hevyWorkoutId === latestWorkout.id) {
      Logger.warn(
        `[auto-share] S:${server.guildId} - U:${user.hevyVerification!.username} | This workout was already shared in this server.`,
      );
      return;
    }
  }

  await autoShareWorkoutToDiscordServer(server, user, latestWorkout);
};

const getUserLastAutoShares = async (
  user: User,
  serverAutoShareConfig: ServerAutoShareConfig,
): Promise<ShareWithWorkout[]> => {
  return await prisma.share.findMany({
    where: {
      sharedBy: {
        is: null,
      },
      Workout: {
        User: {
          is: {
            discordId: user.discordId,
          },
        },
      },
      channelId: serverAutoShareConfig.channelId!,
      reason: "autoShared",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      Workout: true,
    },
    take: 30,
  });
};

const getEnabledUsers = async (
  guildId: string,
): Promise<UserWithHevyVerification[]> => {
  "use cache";
  cacheLife("1d");
  cacheTag(`autoShare:enabledUsers:server:${guildId}`);

  const enabledUsers = await prisma.user.findMany({
    where: {
      UserAutoShareConfig: {
        some: {
          guildId,
          enabled: true,
        },
      },
      hevyVerification: {
        status: "verified",
      },
    },
    include: {
      hevyVerification: true,
      UserAutoShareConfig: true,
    },
  });
  return enabledUsers;
};

export const getAllAutoShareActiveServers = async (userId: string) => {
  return await prisma.server.findMany({
    where: {
      UserAutoShareConfig: {
        some: {
          userId,
          enabled: true,
        },
      },
      ServerAutoShareConfig: {
        enabled: true,
        channelId: {
          not: null,
        },
      },
    },
    include: {
      ServerAutoShareConfig: true,
    },
  });
};

export const executeAutoShare = async () => {
  const enabledServers = await getEnabledServers();
  if (enabledServers.length === 0) {
    Logger.info("[auto-share] No enabled servers found for auto-sharing.");
    return;
  }

  Logger.info(`[auto-share] Found ${enabledServers.length} enabled servers`);

  Promise.all(
    enabledServers.map(async (server) => {
      Logger.info(`[auto-share] Processing server ${server.guildId}`);
      const enabledUsers = await getEnabledUsers(server.guildId);

      Logger.info(
        `[auto-share] S:${server.guildId} | Found ${enabledUsers.length} enabled users in server.`,
      );

      for (const user of enabledUsers) {
        Logger.info(
          `[auto-share] S:${server.guildId} | Processing user ${user.discordId} - ${user.hevyVerification!.username}`,
        );
        await processUserWorkouts(user, server);
      }
    }),
  );
};
