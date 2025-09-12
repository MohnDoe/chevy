import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { isDiscordUserAlreadyLinked } from "../../../controllers/user";
import successfulyLinkedToHevy from "../../components/successfulyLinkedToHevy";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);
  switch (
    (ctx.interaction as ChatInputCommandInteraction).options.getSubcommand()
  ) {
    case "link":
      if (user) {
        (ctx.interaction as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [successfulyLinkedToHevy(user.hevyUsername!)],
        });
        stopMiddlewares();
      }
      break;
    case "unlink":
      if (!user) {
        (ctx.interaction as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral,
          content: `Successfuly unlinked!`,
        });
        stopMiddlewares();
      }
      break;
    default:
      break;
  }
}
