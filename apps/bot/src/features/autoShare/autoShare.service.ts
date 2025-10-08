import { Prisma, prisma, ServerAutoShareConfig, User } from "@repo/db";
import { getUserWorkouts, getWorkout } from "../hevy/hevy.api";
import client from "@/app";
import { HevyWorkout } from "../hevy/hevy.types";
import { toComponent } from "../workout/workout.embeds";
import {
  hyperlink,
  MessageFlags,
  TextDisplayBuilder,
  userMention,
} from "discord.js";
import { Logger } from "commandkit";
import {
  AUTO_SHARE_FORMAT_TO_COMPONENT_FORMAT,
  saveWorkoutShare,
} from "../workout/workout.service";
import { cacheLife, cacheTag } from "@commandkit/cache";
import { getWorkoutUrl } from "../hevy/hevy.parser";

type ServerWithAutoShareConfig = Prisma.ServerGetPayload<{
  where: {
    ServerAutoShareConfig: {
      enabled: true;
      channelId: {
        not: null;
      };
    };
  };
  include: { ServerAutoShareConfig: true };
}>;

type ShareWithWorkout = Prisma.ShareGetPayload<{
  include: { Workout: true };
}>;

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

const shareWorkoutToDiscordServer = async (
  server: ServerWithAutoShareConfig,
  user: User,
  workout: HevyWorkout,
) => {
  const format =
    AUTO_SHARE_FORMAT_TO_COMPONENT_FORMAT[
      server.ServerAutoShareConfig!.workoutFormat
    ];
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
            : [prefixComponent, workoutComponent],
      });

      saveWorkoutShare(workout, user.discordId, channel, "autoShared", format);
    } catch (error) {
      Logger.error(
        `[auto-share] S:${server.guildId} - U:${user.hevyUsername} | Error sending message to channel ${serverConfig.channelId}: ${error}`,
      );
      Logger.error("[auto-share ]" + error);
    }
  } else {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.hevyUsername} | Channel ${serverConfig.channelId} is not sendable.`,
    );
  }
};

const processUserWorkouts = async (
  user: User,
  server: ServerWithAutoShareConfig,
) => {
  if (!user.hevyUsername) {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.discordId} | User does not have a Hevy username configured. Skipping.`,
    );
    return;
  }

  const latestWorkouts = await getUserWorkouts(user.hevyUsername!, 1, 1);

  if (latestWorkouts.length === 0) {
    Logger.warn(
      `[auto-share] S:${server.guildId} - U:${user.hevyUsername} | No workouts found for user ${user.hevyUsername}`,
    );
    return;
  }

  const latestWorkout = await getWorkout(latestWorkouts[0].short_id);
  Logger.info(
    `[auto-share] S:${server.guildId} - U:${user.hevyUsername} | Latest workout for user ${user.hevyUsername}: ${latestWorkout.name} - ${latestWorkout.created_at}`,
  );

  const lastAutoSharesInServerChannel = await getUserLastAutoShares(
    user,
    server.ServerAutoShareConfig!,
  );

  if (lastAutoSharesInServerChannel.length > 0) {
    const lastAutoShare = lastAutoSharesInServerChannel[0];

    if (lastAutoShare.Workout.hevyWorkoutId === latestWorkout.id) {
      Logger.warn(
        `[auto-share] S:${server.guildId} - U:${user.hevyUsername} | This workout was already shared in this server.`,
      );
      return;
    }
  }

  await shareWorkoutToDiscordServer(server, user, latestWorkout);
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

const getEnabledUsers = async (guildId: string): Promise<User[]> => {
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
    },
    include: {
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
          `[auto-share] S:${server.guildId} | Processing user ${user.discordId} - ${user.hevyUsername}`,
        );
        await processUserWorkouts(user, server);
      }
    }),
  );
};
