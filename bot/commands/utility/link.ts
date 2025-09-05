import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Replies with Pong!'),
	async execute(interaction : ChatInputCommandInteraction) {
		await interaction.reply('Pong!');
	},
};
