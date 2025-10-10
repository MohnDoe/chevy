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

const followHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"}  Follow [**@${process.env
      .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()})`,
  );

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"}  Accept follow request from @${
      process.env.BOT_ON_HEVY_USERNAME
    }`,
  );

// const followHevyBotLinkButton = (
//   isFollowing: boolean,
//   targetHevyUsername: string,
//   privateProfile: boolean,
//   user: User,
// ) =>
//   new ButtonKit()
//     .setLabel(isFollowing ? "Following" : "Check")
//     .setStyle(ButtonStyle.Secondary)
//     .setEmoji(isFollowing ? "✅" : "🔄")
//     .setCustomId("followsHevyBotCheckButton")
//     .setDisabled(isFollowing)
//     .onClick(async (interaction, context) => {
//       if (!interaction.deferred) {
//         await interaction.deferUpdate({ withResponse: true });
//       }
//
//       const userFollowsHevyBot = await checkIfUserFollowingBot(
//         targetHevyUsername!,
//       );
//
//       if (userFollowsHevyBot) {
//         await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
//         await setIsFollowingHevyBot(interaction.user.id, true);
//         await setIsHevyProfilePrivate(interaction.user.id, privateProfile);
//       }
//
//       context.dispose();
//
//       await interaction.editReply({
//         components: await generateLinkingInstructions(targetHevyUsername, user),
//       });
//     });

const refreshFollowedStatusButtonComponent = (
  isFollowed: boolean,
  targetHevyUsername: string,
  user: User,
) =>
  new ButtonKit()
    .setLabel(isFollowed ? "Followed" : "Check")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(isFollowed ? "✅" : "🔄")
    .setCustomId("refreshFollowedStatusButton")
    .setDisabled(isFollowed)
    .onClick(async (interaction, context) => {
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      const userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!,
      );

      if (userIsFollowedByHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      context.dispose();
      await interaction.editReply({
        components: await generateLinkingInstructions(targetHevyUsername, user),
      });
    });

const generatePrivateFollowInstructionsComponents = async (
  hevyUsername: string,
  user: User,
) => {
  const userIsFollowedByHevyBot =
    await checkIfUserUserIsFollowedByBot(hevyUsername);

  let components: (ContainerBuilder | TextDisplayBuilder)[] = [
    userIsFollowedByHevyBot
      ? new ContainerBuilder().addTextDisplayComponents(
          getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot),
        )
      : new ContainerBuilder().addSectionComponents((section) =>
          section
            .addTextDisplayComponents(
              getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot),
            )
            .setButtonAccessory(
              refreshFollowedStatusButtonComponent(
                userIsFollowedByHevyBot,
                hevyUsername,
                user,
              ),
            ),
        ),
  ];

  if (!userIsFollowedByHevyBot) {
    components = [
      ...components,
      new TextDisplayBuilder().setContent(
        `Your account is set to private, the bot (@${process.env
          .BOT_ON_HEVY_USERNAME!} on Hevy) won't have access to your workouts, routines, etc. if you are not mutual followers.
        
A follow request was sent out to your account, you need to accept it to proceed.`,
      ),
    ];
  }

  return components;
};

const generateLinkingInstructions = async (
  userVerification: HevyUserVerification,
) => {
  let components: (TextDisplayBuilder | ContainerBuilder | SeparatorBuilder)[] =
    [
      new TextDisplayBuilder().setContent(
        "# Welcome to your Hevy companion bot !",
      ),
      new TextDisplayBuilder().setContent(
        [
          `In order to link your Hevy account (@${userVerification.userHevyUsername}) to Chevy you need to follow these simple steps:`,
          `1. Go to the comment section of ${hyperlink("this workout", `https://hevy.com/workout/${userVerification.workoutId}`)}.`,
          `2. Comment with \`${userVerification.verificationCode}\` **(nothing else, just that!)**`,
          `3. Wait for verification, bot will check for new verification every **5 minutes**.`,
          `4. If everything is fine, the bot has read your comment, your account is verified. And a message will be sent to you.`,
        ].join("\n"),
      ),
      new SeparatorBuilder().setDivider(false),
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
      const userVerification = await findOrCreateUserVerification(
        discordUserId,
        hevyUsername,
      );

      if (!userVerification) {
        // oops
      } else {
        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: await generateLinkingInstructions(userVerification),
        });
      }

      console.log(userVerification);
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
