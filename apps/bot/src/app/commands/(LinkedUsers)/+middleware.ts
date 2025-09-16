import { isDiscordUserAlreadyLinked } from "@/controllers/user.ts";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import {
  AnalyticsEvents,
  noAnalytics,
  useAnalytics,
} from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const analytics = useAnalytics();

  analytics.setFilter(
    (_, event) => event.name != AnalyticsEvents.COMMAND_EXECUTION
  );

  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);

  analytics.identify({
    distinctId: "discord_user_" + userDiscordId,
    properties: {
      ...ctx.interaction.user,

      hevyUsername: user?.hevyUsername,
      hevyProfilePrivate: user?.hevyProfilePrivate,
      isFollowingHevyBot: user?.isFollowingHevyBot,
      isFollowedByHevyBot: user?.isFollowedByHevyBot,
    },
  });

  if (!user) {
    (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
      content: "You are not linked to Hevy yet.",
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  } else {
    ctx.store.set("user", user);
  }
}
