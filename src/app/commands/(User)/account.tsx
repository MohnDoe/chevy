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
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  InteractionContextType,
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

const followHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"} Follow [**@${process.env
      .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()})`
  );

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"} Get followed by @${
      process.env.BOT_ON_HEVY_USERNAME
    } on Hevy.

This will allow the bot to see your workouts even with a private account.`
  );

const sendFollowRequestButton = (enabled: boolean) => (
  <Button
    style={ButtonStyle.Secondary}
    onClick={sendFollowRequestOnClick}
    emoji={enabled ? "🔄" : "✅"}
    disabled={!enabled}
    customId={"sendFollowRequestToUserButton"}
  >
    {enabled ? "Ask to be followed" : "Followed"}
  </Button>
);

const followHevyBotLinkButton = (isFollowing: boolean) =>
  new ButtonKit()
    .setLabel(isFollowing ? "Following" : "Check")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(isFollowing ? "✅" : "🔄")
    .setCustomId("followsHevyBotCheckButton")
    .setDisabled(isFollowing)
    .onClick(followHevyBotLinkButtonOnClick);

const sendFollowRequestOnClick: OnButtonKitClick = async (
  interaction,
  context
) => {
  await context.dispose();
  if (userFollowsHevyBot && !userIsFollowedByHevyBot)
    await followUserOnHevy(targetHevyUsername!);

  context.dispose();
};

let targetHevyUsername: string | null = null;
let userFollowsHevyBot = false;
let userIsFollowedByHevyBot = false;
let hevyUserProfile: any | null = null;

const getHevyUsernameOption = (interaction: ChatInputCommandInteraction) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};

const followHevyBotLinkButtonOnClick: OnButtonKitClick = async (
  interaction,
  context
) => {
  await context.dispose();
  if (!interaction.deferred) {
    await interaction.deferUpdate({ withResponse: true });
  }

  userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);

  const hevyLinkingValidationComponents =
    generateHevyLinkingValidationComponents();

  await interaction.editReply({
    components: hevyLinkingValidationComponents,
  });
};

const generateHevyLinkingValidationComponents = () => {
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

  if (
    userFollowsHevyBot &&
    hevyUserProfile &&
    hevyUserProfile.private_profile
  ) {
    // is user profile private
    components = [
      ...components,
      new TextDisplayBuilder().setContent(
        `Since your account is set to private you need to do one more thing :`
      ),
      new ContainerBuilder().addSectionComponents((section) =>
        section
          .addTextDisplayComponents(
            getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
          )
          .setButtonAccessory(sendFollowRequestButton(!userIsFollowedByHevyBot))
      ),
    ];
  }

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

      const hevyLinkingValidationComponents =
        generateHevyLinkingValidationComponents();

      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: hevyLinkingValidationComponents,
      });

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
