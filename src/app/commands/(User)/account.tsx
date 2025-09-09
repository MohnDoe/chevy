import {
  type ChatInputCommand,
  ChatInputCommandContext,
  CommandMetadata,
  OnButtonKitClick,
  ActionRow,
  Button,
  Container,
  TextDisplay,
  ButtonKit,
} from "commandkit";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
  MessageComponent,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";

import { upsertUser } from "../../../controllers/user";

import {
  checkIfUserFollowingBot,
  checkIfUserUserIsFollowedByBot,
  followUserOnHevy,
  getUserProfile,
} from "../../../hevy/botApi";

const CHECK_LINKING_STATUS_BUTTON_ID = "checkLinkingStatusButton";

let targetHevyUsername: string | null = null;
let userFollowsHevyBot = false;
let userIsFollowedByHevyBot = false;
let hevyUserProfile: any | null = null;

const getHevyUsernameOption = (interaction: ChatInputCommandInteraction) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};

const followHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"} Follow [**@${process.env
      .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()})`
  );

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"} Accept follow request from @${
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
      context.setDisabled(true);
      context.dispose();
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);

      await interaction.editReply({
        components: generateFirstStepHevyLinkingComponents(),
      });

      await checkAndSendPrivateFollowInstruction(interaction);
    });

const refreshFollowedStatusButtonComponent = (isFollowed: boolean) =>
  new ButtonKit()
    .setStyle(ButtonStyle.Secondary)
    .setLabel(isFollowed ? "Followed" : "Check")
    .setEmoji(isFollowed ? "✅" : "🔄")
    .setCustomId("refreshFollowedStatusButton")
    .setDisabled(isFollowed)
    .onClick(async (interaction, context) => {
      context.setDisabled(true);
      context.dispose();

      console.log("refreshFollowedStatusButtonComponent.onClick");
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!
      );

      await interaction.editReply({
        components: generatePrivateFollowInstructionsComponents(
          "refreshFollowedStatusButtonComponent"
        ),
      });
    });

const checkAndSendPrivateFollowInstruction = async (
  interaction: ButtonInteraction | ChatInputCommandInteraction
) => {
  if (
    userFollowsHevyBot &&
    hevyUserProfile &&
    hevyUserProfile.private_profile
  ) {
    if (!interaction.deferred) {
      await interaction.deferReply({ withResponse: true });
    }
    await followUserOnHevy(targetHevyUsername!);
    await interaction.followUp({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: generatePrivateFollowInstructionsComponents(
        "checkAndSendPrivateFollowInstruction"
      ),
    });
  }
};

const generatePrivateFollowInstructionsComponents = (source: string) => {
  console.log("generatePrivateFollowInstructionsComponents", source);

  let components = [
    new TextDisplayBuilder().setContent(
      `Your account is set to private, @${process.env
        .BOT_ON_HEVY_USERNAME!} won't have access to your workouts, routines, etc. if you are not mutual followers.
        
A follow request was sent out to your account, you need to accept it to proceed.`
    ),
    new ContainerBuilder().addSectionComponents((section) =>
      section
        .addTextDisplayComponents(
          getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
        )
        .setButtonAccessory(
          refreshFollowedStatusButtonComponent(userIsFollowedByHevyBot)
        )
    ),
  ];

  return components;
};

const generateFirstStepHevyLinkingComponents = () => {
  console.log("generate");

  let components = [
    new TextDisplayBuilder().setContent(
      "# Welcome to your Hevy companion bot !"
    ),
    new TextDisplayBuilder().setContent(
      `In order to verify that you are the owner of the Hevy account **@${targetHevyUsername}** you need to follow the following steps :`
    ),
    new ContainerBuilder().addSectionComponents((section) =>
      section
        .addTextDisplayComponents(
          followHevyBotTextComponent(userFollowsHevyBot)
        )
        .setButtonAccessory(followHevyBotLinkButton(userFollowsHevyBot))
    ),
  ];

  return components;
};

export const chatInput: ChatInputCommand = async ({
  interaction,
  client,
}: ChatInputCommandContext) => {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });
  const discordUserId = interaction.user.id;
  switch (interaction.options.getSubcommand()) {
    case "link":
      await upsertUser(discordUserId);
      targetHevyUsername = getHevyUsernameOption(interaction);
      hevyUserProfile = await getUserProfile(targetHevyUsername);

      if (!hevyUserProfile) {
        await interaction.followUp({
          content: "This Hevy account does not exist !",
        });

        return;
      }
      userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);
      userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!
      );

      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: generateFirstStepHevyLinkingComponents(),
      });

      await checkAndSendPrivateFollowInstruction(interaction);

      break;

    case "unlink":
      throw new Error("Not yet implemented!");

    default:
      await interaction.followUp("This action does not exist.");
      break;
  }
};

export const metadata: CommandMetadata = {};

export const command = new SlashCommandBuilder()
  .setName("account")
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
