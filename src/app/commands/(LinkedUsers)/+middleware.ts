import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { isDiscordUserAlreadyLinked } from "../../../controllers/user";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);

  if (!user) {
    (ctx.interaction as ChatInputCommandInteraction).reply({
      content: "You are not linked to Hevy yet.",
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  } else {
    ctx.store.set("user", user);
  }
}
