import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { checkIfUserIsVerifiedOnHevy } from "../../../controllers/user";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const verified = await checkIfUserIsVerifiedOnHevy(userDiscordId);

  if (!verified) {
    (ctx.interaction as ChatInputCommandInteraction).reply({
      content: "You are not linked to Hevy yet.",
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  }
}
