import { getUserProfile } from "@/features/hevy/hevy.api";
import { ChatInputCommand, CommandData } from "commandkit";
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, MessageFlags, TextDisplayBuilder } from "discord.js";

export const command: CommandData = {
    name: 'profile',
    description: 'Share your Hevy profile.',
    contexts: [
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel
    ],
    type: ApplicationCommandType.ChatInput,
    integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall]
}

export const chatInput: ChatInputCommand = async ({ interaction, store }) => {
    await interaction.deferReply({})
    const user = store.get("user");

    const hevyProfile = await getUserProfile(user.hevyUsername);

    if (!hevyProfile) {
        await interaction.followUp({
            flags: MessageFlags.Ephemeral,
            content: "This Hevy account does not exist !"
        })
        return
    }

    await interaction.followUp({
        flags: MessageFlags.IsComponentsV2,
        components: [
            new TextDisplayBuilder().setContent(`My profil on Hevy is ${hevyProfile.full_name}`)

        ]
    })

}