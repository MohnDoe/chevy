import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export function beforeExecute(ctx: MiddlewareContext) {
  console.log("Command requires linking to Hevy");
  (ctx.interaction as ChatInputCommandInteraction).reply({
    content: "You are not linked to Hevy yet",
    flags: MessageFlags.Ephemeral,
  });
  stopMiddlewares();
}
