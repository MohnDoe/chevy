import { configModal } from "@/features/autoShare/autoShare.embeds";
import {
  getAutoShareConfig,
  getServerAutoShareParticipantsCount,
  saveAutoShareConfig,
  upsertServer,
} from "@/features/core/server.service";
import { commandMention } from "@/features/discord/command.service";
import { AutoShareWorkoutFormat } from "@repo/db";
import {
  ChatInputCommandContext,
  CommandData,
  CommandKitModalBuilderInteractionCollectorDispatch,
  CommandMetadata,
  Container,
  ModalKit,
  Separator,
  TextDisplay,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  Awaitable,
  bold,
  channelMention,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  underline,
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

export async function chatInput({ interaction }: ChatInputCommandContext) {
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  if (subcommandGroup == "auto-share") {
    switch (subcommand) {
      case "info":
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral,
        });

        const serverAutoShareConfig = await getAutoShareConfig(guildId);

        if (!serverAutoShareConfig) {
          await interaction.followUp({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
              <TextDisplay>
                You don't have auto-share set-up yet. Use
                {await commandMention(`/server auto-share configure`)} to set it
                up now !
              </TextDisplay>,
            ],
          });
        } else {
          const participantCount =
            await getServerAutoShareParticipantsCount(guildId);
          await interaction.followUp({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
              <Container accentColor={Colors.Yellow}>
                <TextDisplay>### What is auto-share?</TextDisplay>
                <TextDisplay>
                  Auto-share allows Chevy to share **automatically** new
                  workouts from your members in a dedicated channel.
                </TextDisplay>
                <TextDisplay>
                  You can configure auto-share with
                  {await commandMention(`/server auto-share configure`)}.
                </TextDisplay>
                <TextDisplay>
                  -# Members can opt-in or out whenever they choose.
                </TextDisplay>
              </Container>,
              <Separator
                spacing={SeparatorSpacingSize.Small}
                divider={false}
              />,
              <TextDisplay>
                Auto-share is
                {underline(
                  serverAutoShareConfig.enabled ? "enabled" : "disabled",
                )}
                !
              </TextDisplay>,
              <TextDisplay>
                New workouts will be shared
                {serverAutoShareConfig.channelId
                  ? `in ${channelMention(serverAutoShareConfig.channelId)}`
                  : bold("nowhere")}
                in a {bold(serverAutoShareConfig.workoutFormat)} format.
              </TextDisplay>,
              <Separator
                spacing={SeparatorSpacingSize.Small}
                divider={false}
              />,
              <TextDisplay>
                -# **{participantCount} members** are currently opted-in to
                auto-share. 🎉
              </TextDisplay>,
            ],
          });
        }
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

            const channel = i.fields.getSelectedChannels(
              "config-channel-select",
              true,
            );
            const format = i.fields.getStringSelectValues(
              "config-format-select",
            )[0];
            await upsertServer(guildId);

            await saveAutoShareConfig(
              guildId,
              statusValue === "true",
              channel as unknown as TextChannel,
              format as AutoShareWorkoutFormat,
            );

            await i.followUp({
              flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
              components: [<TextDisplay>Settings saved.</TextDisplay>],
            });
          },
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
