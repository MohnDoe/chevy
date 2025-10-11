import { commandMention } from "@/features/discord/command.service";
import { getUserVerification } from "@/features/hevy/hevy.service";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { useAnalytics } from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const userVerification = await getUserVerification(userDiscordId);

  if (!userVerification || userVerification.status !== "verified") {
    (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
      content: `This command requires you to be linked to Hevy. Please use the command ${commandMention("hevy link")} and finish the linking process before trying again.`,
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  } else {
    ctx.store.set("userVerification", userVerification);
    const analytics = useAnalytics();

    analytics.identify({
      id: "discord_user_" + userDiscordId,
      hevyUsername: userVerification.username,
      hevyProfilePrivate: userVerification.privateProfile,
      isFollowedByHevyBot: userVerification.followedByBot,
    });
  }
}
