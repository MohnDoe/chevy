import { getAutoShareConfig } from "@/features/core/server.service";
import { commandMention } from "@/features/discord/command.service";
import { Logger, stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags, subtext } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  Logger.info("Checking if server has auto-share enabled.");

  const serverAutoShareConfig = await getAutoShareConfig(
    ctx.interaction.guildId!,
  );

  if (!serverAutoShareConfig?.enabled) {
    (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
      content:
        `Auto-share is not enabled on this server yet.\n` +
        subtext(
          `You can ask a mod or admin to enable Hevy auto-share with the ${await commandMention("server auto-share configure")} command. But be nice about it!`,
        ),
      flags: MessageFlags.Ephemeral,
    });
    return stopMiddlewares();
  }
}
