import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  BaseInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

const CONFIRM_FOLLOW_BOT_ON_HEVY_ID = "confirmFollowBotButton";

const CONFIRMATION_ROW = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(CONFIRM_FOLLOW_BOT_ON_HEVY_ID)
    .setLabel(`I follow @${process.env.BOT_ON_HEVY_USERNAME} on Hevy.`)
    .setStyle(ButtonStyle.Primary)
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Hevy account!")
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ])
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Your Hevy username")
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    });

    const targetHevyUsername = interaction.options
      .getString("username")!
      .trim()
      .toLocaleLowerCase();

    const discordUserId = interaction.user.id;
    const interactionGuildId = interaction.guild?.id;

    await interaction.editReply({
      content: `To verify that you are in fact __@${targetHevyUsername}__ on Hevy, please follow **@${
        process.env.BOT_ON_HEVY_USERNAME
      }** on Hevy <https://www.hevy.com/user/${process.env.BOT_ON_HEVY_USERNAME?.toLocaleLowerCase()}>.`,
      components: [CONFIRMATION_ROW],
    });

    const collectorFilter = (i: BaseInteraction) =>
      i.user.id === interaction.user.id;
  },
};
