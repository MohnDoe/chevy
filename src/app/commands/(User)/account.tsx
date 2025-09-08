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
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { upsertUser } from "../../../controllers/user";
import {
  checkIfUserFollowingBot,
  followUserOnHevy,
} from "../../../hevy/botApi";

const CONFIRM_FOLLOW_BOT_ON_HEVY_ID = "confirmFollowBotButton";

let targetHevyUsername: string | null = null;

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

const checkIfUserFollowedOnHevy: OnButtonKitClick = async (
  interaction,
  context
) => {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });

  const didFollow = await checkIfUserFollowingBot(targetHevyUsername!);

  if (didFollow) {
    await followUserOnHevy(targetHevyUsername!);

    await interaction.followUp({
      content: `You are following @${process.env.BOT_ON_HEVY_USERNAME} on Hevy.
            The bot will now follow you on Hevy, if your account is set to private you need to accept its follow requests.`,
    });
  } else {
    await interaction.followUp({
      content: `You are not following <[**@${process.env
        .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()!})>, in order to link your account your need to.`,
      components: [confirmFollowingTheBotActionRow],
    });
  }

  // Clean up the button context
  context.dispose();
};

const confirmFollowingTheBotActionRow = (
  <ActionRow>
    <Button
      style={ButtonStyle.Primary}
      onClick={checkIfUserFollowedOnHevy}
      customId={CONFIRM_FOLLOW_BOT_ON_HEVY_ID}
    >
      I have followed {process.env.BOT_ON_HEVY_USERNAME!} on Hevy
    </Button>
  </ActionRow>
);

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

      const sentMessage = await interaction.editReply({
        content: `To verify that you are in fact __@${targetHevyUsername}__ on Hevy, please first follow <[**@${process
          .env
          .BOT_ON_HEVY_USERNAME!}** on Hevy](https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME!.toLocaleLowerCase()!})> !`,
        components: [confirmFollowingTheBotActionRow],
      });

      break;

    case "unlink":
      throw new Error("Not yet implemented!");

    default:
      break;
  }
};

export const metadata: CommandMetadata = {};
