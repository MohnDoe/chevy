import { type ChatInputCommand, CommandMetadata, ButtonKit } from "commandkit";

import {
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  hyperlink,
  InteractionContextType,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  subtext,
  TextDisplayBuilder,
} from "discord.js";

import {
  checkIfUserFollowingBot,
  checkIfUserUserIsFollowedByBot,
  followUserOnHevy,
  getUserProfile,
} from "@/features/hevy/hevy.api";

import {
  setIsFollowedByHevyBot,
  setIsHevyProfilePrivate,
  setUserHevyUsername,
  upsertUser,
} from "@/features/hevy/hevy.service";
import { successfulyLinkedToHevy } from "@/features/hevy/hevy.embeds";
import { track } from "commandkit/analytics";
import { sendActivity } from "@/features/liveActivity/liveActivity.service";
import {
  getLastBotFollowRequest,
  updateLastBotFollowRequest,
} from "@/features/core/user.service";
import {
  HevyUserVerification,
  User,
} from "../../../../../../packages/database/generated/prisma";
import dayjs from "dayjs";
import { findOrCreateUserVerification } from "@/features/hevy/verification.service";
import { commandMention } from "@/features/discord/command.service";

const BOT_FOLLOW_REQUEST_DELAY_MINS = 1;

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

export const getHevyUsernameOption = (
  interaction: ChatInputCommandInteraction,
) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};

const generateLinkingInstructions = async (
  userVerification: HevyUserVerification,
) => {
  let components: (TextDisplayBuilder | ContainerBuilder | SeparatorBuilder)[] =
    [
      new TextDisplayBuilder().setContent(
        "# Welcome to your Hevy companion bot !",
      ),
      new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `In order to link your Hevy account (@${userVerification.userHevyUsername}) to Chevy you need to follow these simple steps:`,
            `1. Go to the comment section of ${hyperlink("this workout", `https://hevy.com/workout/${userVerification.workoutId}`)}.`,
            `2. Comment with \`${userVerification.verificationCode}\` **(nothing else, just that!)**`,
            `3. Wait for verification, bot will check for new verification every **5 minutes**.`,
            `4. If everything is fine, the bot has read your comment, your account is verified. And a message will be sent to you.`,
          ].join("\n"),
        ),
      ),
      new TextDisplayBuilder().setContent(
        subtext(
          `If after 15 minutes the bot haven't message you yet, you can re-run the command ${await commandMention("hevy link")}!`,
        ),
      ),
    ];

  return components;
};

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
        await setUserHevyUsername(user.discordId, "");
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
