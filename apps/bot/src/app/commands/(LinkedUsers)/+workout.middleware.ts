import { Logger, type MiddlewareContext } from "commandkit";
import { track } from "commandkit/analytics";
import { ChatInputCommandInteraction } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  Logger.info('Tracking "workout" event in middleware.');

  track({
    name: "workout",
    data: {
      id: "discord_user_" + ctx.interaction.user.id,
      subcommand: (
        ctx.interaction as unknown as ChatInputCommandInteraction
      ).options.getSubcommand(),
      contextType: ctx.interaction.context,
      responseTime: Date.now() - ctx.interaction.createdTimestamp,
    },
  });
}
