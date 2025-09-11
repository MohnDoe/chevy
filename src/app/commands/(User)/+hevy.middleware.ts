import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { isDiscordUserAlreadyLinked } from "../../../controllers/user";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const linked = await isDiscordUserAlreadyLinked(userDiscordId);
  switch (
    (ctx.interaction as ChatInputCommandInteraction).options.getSubcommand()
  ) {
    case "link":
      if (linked) {
        (ctx.interaction as ChatInputCommandInteraction).reply({
          content: `You are already linked to Hevy with the username @${
            linked!.hevyUsername
          }!`,
          flags: MessageFlags.Ephemeral,
        });
        stopMiddlewares();
      }
      break;
    case "unlink":
      if (!linked) {
        (ctx.interaction as ChatInputCommandInteraction).reply({
          content: `Unable to unlink Hevy because you haven't linked your account yet.`,
          flags: MessageFlags.Ephemeral,
        });
        stopMiddlewares();
      }
      break;
    default:
      break;
  }
}
