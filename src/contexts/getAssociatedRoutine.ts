import { BaseInteraction } from "discord.js"

const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} = require('discord.js')

module.exports = {
  wip: true,
  data: new ContextMenuCommandBuilder()
    .setName('Get routine')
    .setType(ApplicationCommandType.Message),
  async execute(interaction: BaseInteraction) {
    // const msg = await interaction.channel?.messages.fetch(interaction.)
    // console.log(msg)
    // check if it's from bot
    // check if it's actually a workout
    // -- if not fuck off
    // get workout URL
    // extract workout ID
    // GET workout infos
    // extract routine ID
    // -- if none, fuck off
    // GET routine infos
    // embed that shit
    // send it
    // done
  },
}
