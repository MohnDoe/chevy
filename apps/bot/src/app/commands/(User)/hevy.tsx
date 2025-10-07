import { type ChatInputCommand, CommandMetadata, ButtonKit } from "commandkit";

import {
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
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
  setIsFollowingHevyBot,
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
import { User } from "../../../../../../packages/database/generated/prisma";
import dayjs from "dayjs";

const BOT_FOLLOW_REQUEST_DELAY_MINS = 1;

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

const followHevyBotLinkButton = (
  isFollowing: boolean,
  targetHevyUsername: string,
  privateProfile: boolean,
  user: User,
) =>
  new ButtonKit()
    .setLabel(isFollowing ? "Following" : "Check")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(isFollowing ? "✅" : "🔄")
    .setCustomId("followsHevyBotCheckButton")
    .setDisabled(isFollowing)
    .onClick(async (interaction, context) => {
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      const userFollowsHevyBot = await checkIfUserFollowingBot(
        targetHevyUsername!,
      );

      if (userFollowsHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowingHevyBot(interaction.user.id, true);
        await setIsHevyProfilePrivate(interaction.user.id, privateProfile);
      }

      context.dispose();

      await interaction.editReply({
        components: await generateLinkingInstructions(targetHevyUsername, user),
      });
    });

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
        `Your account is set to private, @${process.env
          .BOT_ON_HEVY_USERNAME!} won't have access to your workouts, routines, etc. if you are not mutual followers.
        
A follow request was sent out to your account, you need to accept it to proceed.`,
      ),
    ];
  }

  return components;
};

const generateLinkingInstructions = async (
  hevyUsername: string,
  user: User,
) => {
  const userFollowsHevyBot = await checkIfUserFollowingBot(hevyUsername);
  const hevyUserProfile = await getUserProfile(hevyUsername);
  const userIsFollowedByHevyBot =
    await checkIfUserUserIsFollowedByBot(hevyUsername);
  let components: (TextDisplayBuilder | ContainerBuilder | SeparatorBuilder)[] =
    [
      new TextDisplayBuilder().setContent(
        "# Welcome to your Hevy companion bot !",
      ),
      new TextDisplayBuilder().setContent(
        `In order to verify that you are the owner of the Hevy account **@${hevyUsername}** you need to follow the following steps :`,
      ),
      userFollowsHevyBot
        ? new ContainerBuilder().addTextDisplayComponents(
            followHevyBotTextComponent(userFollowsHevyBot),
          )
        : new ContainerBuilder().addSectionComponents((section) =>
            section
              .addTextDisplayComponents(
                followHevyBotTextComponent(userFollowsHevyBot),
              )
              .setButtonAccessory(
                followHevyBotLinkButton(
                  userFollowsHevyBot,
                  hevyUsername,
                  hevyUserProfile.private_profile,
                  user,
                ),
              ),
          ),
    ];

  if (userFollowsHevyBot) {
    if (hevyUserProfile && hevyUserProfile.private_profile) {
      const lastBotFollowRequest = await getLastBotFollowRequest(user);
      let shouldSendFollowRequest =
        lastBotFollowRequest === null ||
        lastBotFollowRequest.lastBotFollowRequest === null;

      // some delay to avoid send follow requests
      if (!shouldSendFollowRequest) {
        shouldSendFollowRequest = dayjs(
          lastBotFollowRequest!.lastBotFollowRequest,
        )
          .add(BOT_FOLLOW_REQUEST_DELAY_MINS, "minutes")
          .isBefore(new Date());
      }

      if (shouldSendFollowRequest) {
        await followUserOnHevy(hevyUsername);
        await updateLastBotFollowRequest(user);
      }
      components = [
        ...components,
        ...(await generatePrivateFollowInstructionsComponents(
          hevyUsername,
          user,
        )),
      ];
    }
  }

  if (userFollowsHevyBot && userIsFollowedByHevyBot) {
    components = [
      ...components,
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
      successfulyLinkedToHevy(hevyUsername),
    ];

    sendActivity(`Someone **linked their Hevy account**.`);
    // TODO: move this elswhere
    // track({
    //   name: "hevy linking success",
    //   id: "discord_user_" + discordUserId,
    // });
  }

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
      const targetHevyUsername = getHevyUsernameOption(
        interaction as unknown as ChatInputCommandInteraction,
      );
      const hevyUserProfile = await getUserProfile(targetHevyUsername);

      if (!hevyUserProfile) {
        await interaction.followUp({
          content: "This Hevy account does not exist !",
        });

        return;
      }

      const userFollowsHevyBot = await checkIfUserFollowingBot(
        targetHevyUsername!,
      );

      if (userFollowsHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowingHevyBot(interaction.user.id, true);
        await setIsHevyProfilePrivate(
          interaction.user.id,
          hevyUserProfile.private_profile,
        );
      }

      const userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!,
      );

      if (userIsFollowedByHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: await generateLinkingInstructions(targetHevyUsername, user),
      });

      break;

    case "unlink":
      if (user) {
        await setUserHevyUsername(user.discordId, "");
        await setIsFollowedByHevyBot(user.discordId, false);
        await setIsFollowingHevyBot(user.discordId, false);
      }
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: "Successfuly unlinked.",
      });

      sendActivity(`Someone **unlinked their Hevy account**.`);
      track({
        name: "hevy unlinking success",
        id: "discord_user_" + discordUserId,
      });
      break;

    default:
      await interaction.followUp("This action does not exist.");
      break;
  }
};

export const metadata: CommandMetadata = {};

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
      .addStringOption((option) =>
        option
          .setName("username")
          .setDescription("Your Hevy username")
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc.setName("unlink").setDescription("Unlink your Hevy account."),
  );
