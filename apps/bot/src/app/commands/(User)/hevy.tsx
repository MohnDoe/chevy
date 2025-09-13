import {
  type ChatInputCommand,
  ChatInputCommandContext,
  CommandMetadata,
  ButtonKit,
} from "commandkit";

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
} from "@/controllers/hevy/botApi.ts";

import {
  getUserByDiscordId,
  setIsFollowedByHevyBot,
  setIsFollowingHevyBot,
  setIsHevyProfilePrivate,
  setUserHevyUsername,
  upsertUser,
} from "@/controllers/user.ts";
import successfulyLinkedToHevy from "@/app/components/successfulyLinkedToHevy.ts";

let targetHevyUsername: string | null = null;
let userFollowsHevyBot = false;
let userIsFollowedByHevyBot = false;
let hevyUserProfile: any | null = null;
let hevyBotFollowRequestSent = false;

export const getHevyUsernameOption = (
  interaction: ChatInputCommandInteraction
) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};

const followHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"}  Follow [**@${process.env
      .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()})`
  );

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"}  Accept follow request from @${
      process.env.BOT_ON_HEVY_USERNAME
    }`
  );

const followHevyBotLinkButton = (isFollowing: boolean) =>
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

      userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);

      if (userFollowsHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowingHevyBot(interaction.user.id, true);
        await setIsHevyProfilePrivate(
          interaction.user.id,
          hevyUserProfile.private_profile
        );
      }

      context.dispose();

      await interaction.editReply({
        components: await generateLinkingInstructions(),
      });
    });

const refreshFollowedStatusButtonComponent = (isFollowed: boolean) =>
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

      userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!
      );

      if (userIsFollowedByHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      context.dispose();
      await interaction.editReply({
        components: await generateLinkingInstructions(),
      });
    });

const generatePrivateFollowInstructionsComponents = () => {
  let components: (ContainerBuilder | TextDisplayBuilder)[] = [
    userIsFollowedByHevyBot
      ? new ContainerBuilder().addTextDisplayComponents(
          getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
        )
      : new ContainerBuilder().addSectionComponents((section) =>
          section
            .addTextDisplayComponents(
              getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
            )
            .setButtonAccessory(
              refreshFollowedStatusButtonComponent(userIsFollowedByHevyBot)
            )
        ),
  ];

  if (!userIsFollowedByHevyBot) {
    components = [
      ...components,
      new TextDisplayBuilder().setContent(
        `Your account is set to private, @${process.env
          .BOT_ON_HEVY_USERNAME!} won't have access to your workouts, routines, etc. if you are not mutual followers.
        
A follow request was sent out to your account, you need to accept it to proceed.`
      ),
    ];
  }

  return components;
};

const generateLinkingInstructions = async () => {
  let components: (TextDisplayBuilder | ContainerBuilder | SeparatorBuilder)[] =
    [
      new TextDisplayBuilder().setContent(
        "# Welcome to your Hevy companion bot !"
      ),
      new TextDisplayBuilder().setContent(
        `In order to verify that you are the owner of the Hevy account **@${targetHevyUsername}** you need to follow the following steps :`
      ),
      userFollowsHevyBot
        ? new ContainerBuilder().addTextDisplayComponents(
            followHevyBotTextComponent(userFollowsHevyBot)
          )
        : new ContainerBuilder().addSectionComponents((section) =>
            section
              .addTextDisplayComponents(
                followHevyBotTextComponent(userFollowsHevyBot)
              )
              .setButtonAccessory(followHevyBotLinkButton(userFollowsHevyBot))
          ),
    ];

  if (userFollowsHevyBot) {
    if (hevyUserProfile && hevyUserProfile.private_profile) {
      if (!hevyBotFollowRequestSent && !userIsFollowedByHevyBot) {
        await followUserOnHevy(targetHevyUsername!);
        hevyBotFollowRequestSent = true;
      }
      components = [
        ...components,
        ...generatePrivateFollowInstructionsComponents(),
      ];
    }
  }

  if (userFollowsHevyBot && userIsFollowedByHevyBot) {
    components = [
      ...components,
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
      successfulyLinkedToHevy(targetHevyUsername!),
    ];
  }

  return components;
};

export const chatInput: ChatInputCommand = async ({ interaction, client }) => {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });
  const discordUserId = interaction.user.id;
  switch (interaction.options.getSubcommand()) {
    case "link":
      await upsertUser(discordUserId);
      targetHevyUsername = getHevyUsernameOption(
        interaction as unknown as ChatInputCommandInteraction
      );
      hevyUserProfile = await getUserProfile(targetHevyUsername);

      if (!hevyUserProfile) {
        await interaction.followUp({
          content: "This Hevy account does not exist !",
        });

        return;
      }

      userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);

      if (userFollowsHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowingHevyBot(interaction.user.id, true);
        await setIsHevyProfilePrivate(
          interaction.user.id,
          hevyUserProfile.private_profile
        );
      }

      userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!
      );

      if (userIsFollowedByHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: await generateLinkingInstructions(),
      });

      break;

    case "unlink":
      const user = await getUserByDiscordId(discordUserId);

      if (user) {
        await setUserHevyUsername(user.discordId, "");
        await setIsFollowedByHevyBot(user.discordId, false);
        await setIsFollowingHevyBot(user.discordId, false);
      }
      await interaction.followUp({
        flags: MessageFlags.Ephemeral,
        content: "Successfuly unlinked.",
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
          .setRequired(true)
      )
  )
  .addSubcommand((sc) =>
    sc.setName("unlink").setDescription("Unlink your Hevy account.")
  );
