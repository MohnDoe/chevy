import { Logger, type MiddlewareContext } from "commandkit";
import { AnalyticsEvents, useAnalytics } from "commandkit/analytics";

export async function beforeExecute(ctx: MiddlewareContext) {
  Logger.info("Setting up tracking filters and identifying user.");

  const analytics = useAnalytics();

  // stop Commandkit from tracking "command_execution"
  analytics.setFilter(
    (_, event) => event.name != AnalyticsEvents.COMMAND_EXECUTION
  );
  const userDiscordId = ctx.interaction.user.id;

  analytics.identify({
    id: "discord_user_" + userDiscordId,
    name: ctx.interaction.user.username,
    bot: ctx.interaction.user.bot,
  });
}
