import {
  configInfosContainer,
  configModal,
} from "@/features/autoShare/autoShare.embeds";
import {
  getServerAutoShareParticipantsCount,
  saveAutoShareConfig,
  upsertServer,
} from "@/features/core/server.service";
import { commandMention } from "@/features/discord/command.service";
import { ServerAutoShareConfig, WorkoutFormat } from "@repo/db";
import {
  ChatInputCommandContext,
  CommandData,
  CommandMetadata,
  Container,
  Separator,
  TextDisplay,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  Colors,
  InteractionContextType,
  MessageFlags,
  SeparatorSpacingSize,
  TextChannel,
} from "discord.js";

export const metadata: CommandMetadata = {
  userPermissions: ["ManageGuild"],
};

export const command: CommandData = {
  name: "server",
  description: "Set-up Chevy on this server.",
  contexts: [InteractionContextType.Guild],
  integration_types: [ApplicationIntegrationType.GuildInstall],
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "auto-share",
      description: "Chevy's auto-share feature !",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "configure",
          description: "Configure auto-share feature.",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: "info",
          description: "Explanations, current configuration and stats",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
  ],
};

export async function chatInput({
  interaction,
  store,
}: ChatInputCommandContext) {
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  const currentServerAutoShareConfig = store.get(
    "serverAutoShareConfig",
  ) as ServerAutoShareConfig | null;

  if (subcommandGroup == "auto-share") {
    switch (subcommand) {
      case "info":
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral,
        });

        const participantCount = currentServerAutoShareConfig
          ? await getServerAutoShareParticipantsCount(guildId)
          : 0;
        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [
            await configInfosContainer(
              currentServerAutoShareConfig,
              participantCount,
            ),
            <Separator spacing={SeparatorSpacingSize.Small} divider={false} />,
            <Container accentColor={Colors.DarkButNotBlack}>
              <TextDisplay>### What is auto-share?</TextDisplay>
              <TextDisplay>
                Auto-share allows Chevy to share **automatically** new workouts
                from your members in a dedicated channel.
              </TextDisplay>
              <TextDisplay>
                You can configure auto-share with
                {await commandMention(`/server auto-share configure`)}.
              </TextDisplay>
              <TextDisplay>
                -# Members can opt-in or out whenever they choose.
              </TextDisplay>
            </Container>,
          ],
        });

        break;

      case "configure":
        const modal = configModal(
          (i) => i.user.id === interaction.user.id,
          async (i) => {
            await i.deferReply({
              flags: MessageFlags.Ephemeral,
            });

            const statusValue = i.fields.getStringSelectValues(
              "config-enabled-select",
            )[0];

            const enabled = statusValue === "true";

            const channels = i.fields.getSelectedChannels(
              "config-channel-select",
              true,
            );

            const channel = channels.first() as unknown as TextChannel;

            const format = i.fields.getStringSelectValues(
              "config-format-select",
            )[0];

            await upsertServer(guildId);

            const newServer = await saveAutoShareConfig(
              guildId,
              enabled,
              channel,
              format as WorkoutFormat,
            );
            const participantCount = enabled
              ? await getServerAutoShareParticipantsCount(guildId)
              : 0;

            await i.followUp({
              flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
              components: [
                <TextDisplay>**Settings saved!**</TextDisplay>,
                await configInfosContainer(
                  newServer.ServerAutoShareConfig,
                  participantCount,
                ),
              ],
            });
          },
          currentServerAutoShareConfig,
        );

        await interaction.showModal(modal);
        break;

      default:
        await interaction.followUp({
          components: [<TextDisplay>Unknown command.</TextDisplay>],
        });
        break;
    }
    return;
  }

  await interaction.followUp({
    components: [<TextDisplay>Unknown command.</TextDisplay>],
  });
}
