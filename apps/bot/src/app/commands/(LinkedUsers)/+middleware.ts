import { commandMention } from "@/features/discord/command.service";
import { getHevyVerifiedUserByDiscordId } from "@/features/hevy/hevy.service";
import { stopMiddlewares, type MiddlewareContext } from "commandkit";
import { useAnalytics } from "commandkit/analytics";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function beforeExecute(ctx: MiddlewareContext) {
  const userDiscordId = ctx.interaction.user.id;
  const user = await getHevyVerifiedUserByDiscordId(userDiscordId);

  if (!user) {
    (ctx.interaction as unknown as ChatInputCommandInteraction).reply({
      content: `This command requires you to be linked to Hevy. Please use the command ${await commandMention("hevy link")} and finish the linking process before trying again.`,
      flags: MessageFlags.Ephemeral,
    });
    stopMiddlewares();
  } else {
    ctx.store.set("userWithHevyVerification", user);
    const analytics = useAnalytics();

    analytics.identify({
      id: "discord_user_" + userDiscordId,
      hevyUsername: user.hevyVerification!.username,
      hevyProfilePrivate: user.hevyVerification!.privateProfile,
      isFollowedByHevyBot: user.hevyVerification!.followedByBot,
    });
  }
}
