import { ChatInputCommandInteraction } from "discord.js";

export const getHevyUsernameOption = (
  interaction: ChatInputCommandInteraction,
) => {
  return interaction.options.getString("username")!.trim().toLocaleLowerCase();
};
