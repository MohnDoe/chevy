import {
  BaseInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { getUserLatestWorkout } from "../../hevy/api";
import { embedWorkout } from "../../hevy/utils/embedder";

module.exports = {
  wip: true,
  data: new SlashCommandBuilder()
    .setName("share")
    .setDescription("Share one of your workouts on this channel now")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand((sc) =>
      sc.setName("latest").setDescription("Share your last finished workout.")
    )
    .addSubcommand((sc) =>
      sc
        .setName("list")
        .setDescription("Select one from a list of recent workouts.")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log(interaction);

    const workout = await getUserLatestWorkout("mohndoe");

    if (workout) {
          const embeds = [embedWorkout(workout)]

          await interaction.reply({
            content: `<@${interaction.user.id}> latest workout.`,
            embeds,
            flags: MessageFlags.Ephemeral
          })
        } else {
          await interaction.reply({
            content: 'No latest workout found.',
            ephemeral: true,
          })
        }
  },
};
