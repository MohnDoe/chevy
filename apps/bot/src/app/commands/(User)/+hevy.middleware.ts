import successfulyLinkedToHevy from "@/app/components/successfulyLinkedToHevy.ts";
import { isDiscordUserAlreadyLinked } from "@/controllers/user.ts";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { track } from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);
  track({
    name: "hevy command used",
    id: "discord_user_" + ctx.interaction.user.id,
    data: {
      subcommand: (
        ctx.interaction as unknown as ChatInputCommandInteraction
      ).options.getSubcommand(),
      channelType: ctx.interaction.channel?.type,
      contextType: ctx.interaction.context,
      responseTime: Date.now() - ctx.interaction.createdTimestamp,
    },
  });
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
          name: "hevy account was already linked",
          id: "discord_user_" + ctx.interaction.user.id,
          data: {
            contextType: ctx.interaction.context,
            channelType: ctx.interaction.channel?.type,
            responseTime: Date.now() - ctx.interaction.createdTimestamp,
          },
        });
        stopMiddlewares();
      }
      break;
    case "unlink":
      if (!user) {
        (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral,
          content: `Successfuly unlinked!`,
        });

        track({
          name: "hevy account was already unlinked",
          id: "discord_user_" + ctx.interaction.user.id,
          data: {
            contextType: ctx.interaction.context,
            channelType: ctx.interaction.channel?.type,
            responseTime: Date.now() - ctx.interaction.createdTimestamp,
          },
        });
        stopMiddlewares();
      }
      break;
    default:
      break;
  }
}
