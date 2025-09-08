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
    `${done ? "✅" : "❌"} Follow [**@${process.env
      .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()!})`
  );

const verifyHevyBotFollowButtonComponent = (disabled: boolean) => (
  <Button
    style={ButtonStyle.Secondary}
    onClick={checkIfUserFollowedOnHevyButtonClick}
    disabled={disabled}
    emoji={disabled ? "✅" : "🔄"}
    customId={CHECK_LINKING_STATUS_BUTTON_ID}
  >
    {disabled ? "Successfuly linked" : "Check"}
  </Button>
);

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "❌"} Get followed by @${
      process.env.BOT_ON_HEVY_USERNAME
    } on Hevy.
    **If your account is set to private, you'll have to accept the follow request.**`
  );

let targetHevyUsername: string | null = null;
let userFollowsHevyBot = false;
let userIsFollowedByHevyBot = false;

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

const getHevyUsernameOption = (interaction: ChatInputCommandInteraction) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};

const checkIfUserFollowedOnHevyButtonClick: OnButtonKitClick = async (
  interaction,
  context
) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  userFollowsHevyBot = await checkIfUserFollowingBot(targetHevyUsername!);
  userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
    targetHevyUsername!
  );

  if (!userIsFollowedByHevyBot) await followUserOnHevy(targetHevyUsername!);

  await interaction.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [generateHevyLinkingValidationComponent()],
  });

  // Clean up the button context
  context.dispose();
};

const generateHevyLinkingValidationComponent = () => {
  const introText = new TextDisplayBuilder().setContent(
    `**In order to verify that you are the owner of the Hevy account @${targetHevyUsername} you need to follow the following steps :**`
  );

  const isAlreadyLinked = userFollowsHevyBot && userIsFollowedByHevyBot;

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# Welcome to your Hevy companion bot !"
      )
    )
    .addTextDisplayComponents(introText)
    .addSeparatorComponents((s) => s)
    .addTextDisplayComponents(followHevyBotTextComponent(userFollowsHevyBot))
    .addTextDisplayComponents(
      getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot)
    )
    .addSeparatorComponents((s) => s)
    .addActionRowComponents((actionRow) =>
      actionRow.setComponents([
        verifyHevyBotFollowButtonComponent(isAlreadyLinked),
      ])
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

      await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: [generateHevyLinkingValidationComponent()],
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
