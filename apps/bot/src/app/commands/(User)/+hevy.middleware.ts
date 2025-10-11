import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { track } from "commandkit/analytics";
import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";

import { successfulyLinkedToHevy } from "@/features/hevy/hevy.embeds";
import { generatePrivateFollowInstructionsComponents } from "@/features/hevy/verification.embeds";
import { getUserVerification } from "@/features/hevy/hevy.service";
import {
  checkIfUserUserIsFollowedByBot,
  followUserOnHevy,
} from "@/features/hevy/hevy.api";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const userVerification = await getUserVerification(userDiscordId);
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
      if (userVerification?.status == "verified") {
        let components: (
          | ContainerBuilder
          | TextDisplayBuilder
          | SeparatorBuilder
        )[] = await successfulyLinkedToHevy(userVerification, true);

        if (userVerification.privateProfile) {
          const isFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
            userVerification.username!,
          );
          if (!isFollowedByHevyBot) {
            await followUserOnHevy(userVerification.username);
          }

          components = [
            ...components,
            ...(await generatePrivateFollowInstructionsComponents(
              userVerification,
              userVerification.followedByBot, // current status
            )),
          ];
        }

        (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components,
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
