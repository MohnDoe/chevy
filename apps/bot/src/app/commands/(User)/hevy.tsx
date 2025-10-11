import { type ChatInputCommand, CommandMetadata } from "commandkit";

import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";

import { getUserProfile } from "@/features/hevy/hevy.api";

import { getHevyUsernameOption } from "@/features/discord/utils.service";
import {
  setIsFollowedByHevyBot,
  setUserHevyUsername,
  upsertUser,
} from "@/features/hevy/hevy.service";
import { generateLinkingInstructions } from "@/features/hevy/verification.embeds";
import { findOrCreateUserVerification } from "@/features/hevy/verification.service";
import { sendActivity } from "@/features/liveActivity/liveActivity.service";
import { track } from "commandkit/analytics";
import { unlinkHevy } from "@/features/core/user.service";

export const command = new SlashCommandBuilder()
  .setName("hevy")
  .setDescription("Set-up your Hevy account.")
  .setContexts([
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ])
  .addSubcommand((sc) =>
    sc
      .setName("link")
      .setDescription("Link your Hevy account.")
      .addStringOption((o) =>
        o
          .setName("username")
          .setDescription("Your Hevy username.")
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc.setName("unlink").setDescription("Unlink your Hevy account."),
  );

export const chatInput: ChatInputCommand = async ({ interaction }) => {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });
  const discordUserId = interaction.user.id;
  const user = await upsertUser(discordUserId);
  switch (interaction.options.getSubcommand()) {
    case "link":
      const hevyUsername = getHevyUsernameOption(
        interaction as unknown as ChatInputCommandInteraction,
      );
      const hevyProfile = await getUserProfile(hevyUsername);

      if (!hevyProfile) {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new TextDisplayBuilder().setContent(
              `Couldn't find the Hevy profile @${hevyUsername}. Please retry with an existing profile.`,
            ),
          ],
        });
        return;
      }

      const pendingUserVerification = await findOrCreateUserVerification(
        discordUserId,
        hevyUsername,
      );

      if (!pendingUserVerification) {
        // oops
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new TextDisplayBuilder().setContent(
              `An error occured during the verification process. Please try again later.`,
            ),
          ],
        });
      } else {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: await generateLinkingInstructions(
            pendingUserVerification,
          ),
        });
      }
      break;

    case "unlink":
      if (user) {
        await unlinkHevy(user.discordId);
        await setIsFollowedByHevyBot(user.discordId, false);
      }
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: "Successfuly unlinked.",
      });

      sendActivity(`Someone **unlinked their Hevy account**.`);

      track({
        name: "hevy unlinking success",
        id: "discord_user_" + user.discordId,
      });
      break;

    default:
      await interaction.followUp("This action does not exist.");
      break;
  }
};

export const metadata: CommandMetadata = {};
