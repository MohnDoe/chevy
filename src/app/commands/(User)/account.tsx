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
let followRequestSent = false;

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

const sendFollowRequestButton = (disabled: boolean) => (
  <Button
    style={disabled ? ButtonStyle.Secondary : ButtonStyle.Primary}
    onClick={async (interaction, context) => {
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }
      await context.setDisabled(true);
      await context.dispose();
      // TODO: uncomment
      // if (userFollowsHevyBot && !userIsFollowedByHevyBot)
      //   await followUserOnHevy(targetHevyUsername!);
      followRequestSent = true;

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: privateFollowInstructionsComponents(),
      });
    }}
    emoji={"✉"}
    disabled={disabled}
    customId={"sendFollowRequestToUserButton"}
  >
    Get follow request
  </Button>
);

const followHevyBotLinkButton = (isFollowing: boolean) =>
  new ButtonKit()
    .setLabel(isFollowing ? "Following" : "Check")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(isFollowing ? "✅" : "🔄")
    .setCustomId("followsHevyBotCheckButton")
    .setDisabled(isFollowing)
    .onClick(async (interaction, context) => {
      await context.setDisabled(true);
      await context.dispose();
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);

      await interaction.editReply({
        components: generateFirstStepHevyLinkingComponents(),
      });

      await checkAndSendPrivateFollowInstruction(interaction);
    });

const refreshButtonComponent = (disabled: boolean) =>
  new ButtonKit()
    .setStyle(ButtonStyle.Secondary)
    .setLabel("I have accepted")
    .setDisabled(disabled)
    .setCustomId("refreshFollowedStatus")
    .onClick((i, c) => {
      followRequestSent = false;
    });

const checkAndSendPrivateFollowInstruction = async (
  interaction: ButtonInteraction | ChatInputCommandInteraction
) => {
  if (!userIsFollowedByHevyBot) {
    if (
      userFollowsHevyBot &&
      hevyUserProfile &&
      hevyUserProfile.private_profile
    ) {
      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: privateFollowInstructionsComponents(),
      });
    }
  }
};

const privateFollowInstructionsComponents = () => {
  let components = [
    new TextDisplayBuilder().setContent(
      `Since your account is set to private you need to do one more thing :`
    ),
    new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((td) =>
            td.setContent(
              followRequestSent
                ? "A follow request has been sent to you on Hevy. Open Hevy and accept it in order to continue."
                : "Click this button to get a friend request"
            )
          )
          .setButtonAccessory(
            sendFollowRequestButton(
              userIsFollowedByHevyBot || followRequestSent
            )
          )
      ),
    new ContainerBuilder().addSectionComponents((section) =>
      section
        .addTextDisplayComponents(
          getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
        )
        .setButtonAccessory(refreshButtonComponent(!followRequestSent))
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
