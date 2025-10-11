import { getUserVerification } from "@/features/hevy/hevy.service";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { useAnalytics } from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const userVerification = await getUserVerification(userDiscordId);

  if (!userVerification || userVerification.status !== "verified") {
    // TODO: add linking instructions here
    (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
      content: "You are not linked to Hevy yet.",
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  } else {
    ctx.store.set("user", userVerification.User);
    const analytics = useAnalytics();

    analytics.identify({
      id: "discord_user_" + userDiscordId,
      hevyUsername: userVerification.username,
      hevyProfilePrivate: userVerification.privateProfile,
      isFollowedByHevyBot: userVerification.followedByBot,
    });
  }
}
