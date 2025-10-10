import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { track } from "commandkit/analytics";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";

import { successfulyLinkedToHevy } from "@/features/hevy/hevy.embeds";
import { isDiscordUserAlreadyLinked } from "@/features/hevy/hevy.service";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const userVerification = await isDiscordUserAlreadyLinked(userDiscordId);
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
      if (userVerification) {
        (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [
            successfulyLinkedToHevy(userVerification.userHevyUsername, true),
          ],
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
      if (!userVerification) {
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
