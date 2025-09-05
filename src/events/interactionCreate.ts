import { BaseInteraction, Events } from "discord.js"

import { ChevyClient } from "../types/ChevyClient";

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction: BaseInteraction) {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isUserContextMenuCommand() &&
      !interaction.isMessageContextMenuCommand()
    ) {
      return
    }

    // Use the typed client
    const client = interaction.client as ChevyClient;
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`)
      return
    }

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`)
      console.error(error)
    }
  },
}
