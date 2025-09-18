import successfulyLinkedToHevy from "@/app/components/successfulyLinkedToHevy.ts";
import { isDiscordUserAlreadyLinked } from "@/controllers/user.ts";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { track } from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);

  switch (
    (
      ctx.interaction as unknown as ChatInputCommandInteraction
    ).options.getSubcommand()
  ) {
    case "link":
      if (user) {
        (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [successfulyLinkedToHevy(user.hevyUsername!)],
        });
        track({
          id: "discord_user_" + ctx.interaction.user.id,
          name: "Already linked Hevy",
          data: {
            contextType: ctx.interaction.context,
            responseTime: Date.now() - ctx.interaction.createdTimestamp,
          },
        });
        stopMiddlewares();
      } else {
        track({
          id: "discord_user_" + ctx.interaction.user.id,
          name: "Begin linking Hevy",
          data: {
            contextType: ctx.interaction.context,
            responseTime: Date.now() - ctx.interaction.createdTimestamp,
          },
        });
      }
      break;
    case "unlink":
      if (!user) {
        (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral,
          content: `Successfuly unlinked!`,
        });
        stopMiddlewares();
      } else {
        track({
          id: "discord_user_" + ctx.interaction.user.id,
          name: "Begin unlinking Hevy",
          data: {
            contextType: ctx.interaction.context,
            responseTime: Date.now() - ctx.interaction.createdTimestamp,
          },
        });
      }
      break;
    default:
      break;
  }
}
