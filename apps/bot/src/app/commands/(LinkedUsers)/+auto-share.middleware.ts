import { getAutoShareConfig } from "@/features/core/server.service";
import { Logger, stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
    Logger.info('Checking if server has auto-share enabled.');

    const serverAutoShareConfig = await getAutoShareConfig(ctx.interaction.guildId!);

    if (!serverAutoShareConfig?.enabled) {
        (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
            content: "Auto-share is not enabled on this server yet.",
            flags: MessageFlags.Ephemeral,
        });
        return stopMiddlewares();
    }
}
