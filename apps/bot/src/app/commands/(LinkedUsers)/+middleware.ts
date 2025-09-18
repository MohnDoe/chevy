import { isDiscordUserAlreadyLinked } from "@/controllers/user.ts";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { useAnalytics } from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await isDiscordUserAlreadyLinked(userDiscordId);

  if (!user) {
    (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
      content: "You are not linked to Hevy yet.",
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  } else {
    ctx.store.set("user", user);
    const analytics = useAnalytics();

    analytics.identify({
      id: "discord_user_" + userDiscordId,
      hevyUsername: user.hevyUsername,
      hevyProfilePrivate: user.hevyProfilePrivate,
      isFollowingHevyBot: user.isFollowingHevyBot,
      isFollowedByHevyBot: user.isFollowedByHevyBot,
    });
  }
}
