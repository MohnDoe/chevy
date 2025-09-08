import {
  type ChatInputCommand,
  ChatInputCommandContext,
  CommandMetadata,
  OnButtonKitClick,
  ActionRow,
  Button,
  Container,
  TextDisplay,
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
} from "../../../hevy/botApi";

const CHECK_LINKING_STATUS_BUTTON_ID = "checkLinkingStatusButton";

const followHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `### ${done ? "✅" : "⏳"} Follow [**@${process.env
      .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()})`
  );

const checkStatusAndUpdate = (disabled: boolean) => (
  <Button
    style={ButtonStyle.Secondary}
    onClick={checkStatusAndUpdateButtonOnClick}
    disabled={disabled}
    emoji={disabled ? "✅" : "🔄"}
    customId={CHECK_LINKING_STATUS_BUTTON_ID}
  >
    {disabled ? "Successfuly linked" : "Check"}
  </Button>
);

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `
### ${done ? "✅" : "⏳"} Get followed by @${
      process.env.BOT_ON_HEVY_USERNAME
    } on Hevy.
If your account is set to private, you'll have to **accept the follow request.**`
  );

const sendFollowRequestButton = (enabled: boolean) => (
  <Button
    style={ButtonStyle.Secondary}
    onClick={sendFollowRequestOnClick}
    emoji={enabled ? "🔄" : ""}
    disabled={!enabled}
    customId={"sendFollowRequestToUserButton"}
  >
    {enabled ? "Send follow request" : "First, follow"}
  </Button>
);

const followHevyBotLinkButton = (isFollowing: boolean) => (
  <Button
    style={ButtonStyle.Link}
    disabled={isFollowing}
    url={`https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()}`}
  >
    Open Hevy
  </Button>
);

const sendFollowRequestOnClick: OnButtonKitClick = async (
  interaction,
  context
) => {
  if (userFollowsHevyBot && !userIsFollowedByHevyBot)
    await followUserOnHevy(targetHevyUsername!);

  context.dispose();
};

let targetHevyUsername: string | null = null;
let userFollowsHevyBot = false;
let userIsFollowedByHevyBot = false;

const getHevyUsernameOption = (interaction: ChatInputCommandInteraction) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};

const checkStatusAndUpdateButtonOnClick: OnButtonKitClick = async (
  interaction,
  context
) => {
  if (!interaction.deferred) {
    await interaction.deferUpdate({ withResponse: true });
  }
  userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);
  userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
    targetHevyUsername!
  );

  const hevyLinkingValidationComponent =
    generateHevyLinkingValidationComponent(true);

  await interaction.editReply({
    components: [hevyLinkingValidationComponent],
  });

  // Clean up the button context
  context.dispose();
};

const generateHevyLinkingValidationComponent = (
  enableSendFollowRequestButton: boolean
) => {
  console.log("generate");
  const introText = new TextDisplayBuilder().setContent(
    `In order to verify that you are the owner of the Hevy account **@${targetHevyUsername}** you need to follow the following steps :`
  );

  const isAlreadyLinked = userFollowsHevyBot && userIsFollowedByHevyBot;

  return (
    new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "# Welcome to your Hevy companion bot !"
        )
      )
      .addTextDisplayComponents((_) => introText)
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents(followHevyBotTextComponent(userFollowsHevyBot))
      // .setButtonAccessory(followHevyBotLinkButton(userFollowsHevyBot))
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents(
            getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
          )
          .setButtonAccessory(
            sendFollowRequestButton(
              !userIsFollowedByHevyBot &&
                enableSendFollowRequestButton &&
                userFollowsHevyBot
            )
          )
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents((actionRow) =>
        actionRow.setComponents([checkStatusAndUpdate(isAlreadyLinked)])
      )
  );
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
      userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);
      userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!
      );

      const hevyLinkingValidationComponent =
        generateHevyLinkingValidationComponent(false);

      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: [hevyLinkingValidationComponent],
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
