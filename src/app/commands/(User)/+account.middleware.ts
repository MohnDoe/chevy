import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import {
  checkIfUserIsVerifiedOnHevy,
  getUserByDiscordId,
} from "../../../controllers/user";
import { getHevyUsernameOption } from "./account";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const verified = await checkIfUserIsVerifiedOnHevy(userDiscordId);
  switch (
    (ctx.interaction as ChatInputCommandInteraction).options.getSubcommand()
  ) {
    case "link":
      const user = await getUserByDiscordId(userDiscordId);
      if (
        user &&
        user.hevyUsername ==
          getHevyUsernameOption(
            ctx.interaction as ChatInputCommandInteraction
          ) &&
        user.isVerifiedOnHevy
      ) {
        (ctx.interaction as ChatInputCommandInteraction).reply({
          content: `You are already linked to Hevy with the username @${
            user!.hevyUsername
          }!`,
          flags: MessageFlags.Ephemeral,
        });
        stopMiddlewares();
      }
      break;
    case "unlink":
      if (!verified) {
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
