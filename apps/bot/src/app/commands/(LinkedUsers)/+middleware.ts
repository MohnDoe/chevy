import { isDiscordUserAlreadyLinked } from "@/controllers/user.ts";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);

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
