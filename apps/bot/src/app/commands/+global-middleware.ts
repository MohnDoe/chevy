import { upsertServer } from "@/features/core/server.service";
import { Logger, type MiddlewareContext } from "commandkit";
import { AnalyticsEvents, useAnalytics } from "commandkit/analytics";

export async function beforeExecute(ctx: MiddlewareContext) {
  Logger.info("Setting up tracking filters, identifying user and server.");

  if (ctx.interaction.guildId && !ctx.store.has("server")) {
    const server = await upsertServer(ctx.interaction.guildId);
    ctx.store.set("server", server);
  }

  const analytics = useAnalytics();

  // dont track these events
  analytics.setFilter(
    (_, event) =>
      !(
        [
          AnalyticsEvents.COMMAND_EXECUTION,
          AnalyticsEvents.CACHE_HIT,
          AnalyticsEvents.CACHE_MISS,
          AnalyticsEvents.CACHE_REVALIDATED,
        ] as string[]
      ).includes(event.name),
  );
  const userDiscordId = ctx.interaction.user.id;

  analytics.identify({
    id: "discord_user_" + userDiscordId,
    name: ctx.interaction.user.username,
    bot: ctx.interaction.user.bot,
  });
}
