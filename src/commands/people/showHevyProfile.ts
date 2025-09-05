import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
} from "discord.js";

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Get Hevy Profile")
    .setType(ApplicationCommandType.User),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isUserContextMenuCommand()) return;
    console.log(interaction);
  },
};
