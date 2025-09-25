import {
  ActionRow,
  ButtonKit,
  ChannelSelectMenu,
  ChannelSelectMenuKit,
  ChatInputCommandContext,
  CommandData,
  CommandMetadata,
  Container,
  Separator,
  StringSelectMenu,
  StringSelectMenuKit,
  StringSelectMenuOption,
  TextDisplay,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  bold,
  ButtonStyle,
  channelMention,
  ChannelSelectMenuInteraction,
  ChannelType,
  Colors,
  InteractionContextType,
  MessageFlags,
  SeparatorSpacingSize,
  StringSelectMenuInteraction,
  TextChannel,
  underline,
} from "discord.js";
import { AutoShareWorkoutFormat } from "../../../../../../packages/database/generated/prisma";
import {
  getAutoShareConfig,
  getServerAutoShareParticipantsCount,
  saveAutoShareConfig,
  upsertServer,
} from "@/features/core/server.service";

export const metadata: CommandMetadata = {
  userPermissions: ["ManageGuild"],
};

const _active = true;
const _mode = AutoShareWorkoutFormat.line;
const _participantCount = 23;

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
          options: [
            {
              name: "enabled",
              description:
                "Should auto-share be enabled and sending new workouts?",
              type: ApplicationCommandOptionType.Boolean,
              required: true,
            },
            {
              name: "channel",
              description: "Destination channel",
              type: ApplicationCommandOptionType.Channel,
              channel_types: [ChannelType.GuildText],
              required: true,
            },
            {
              name: "format",
              description: "What does the message look like?",
              type: ApplicationCommandOptionType.String,
              choices: Object.entries(AutoShareWorkoutFormat).map(
                ([key, value]) => ({
                  name: key,
                  value: value,
                })
              ),

              required: true,
            },
          ],
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

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  if (subcommandGroup == "auto-share") {
    switch (subcommand) {
      case "info":
        const serverAutoShareConfig = await getAutoShareConfig(guildId);

        if (!serverAutoShareConfig) {
          await interaction.followUp({
            flags: MessageFlags.Ephemeral,
            components: [
              <TextDisplay>
                You don't have auto-share set-up yet. Use `/server auto-share
                configure` to set it up now !
              </TextDisplay>,
            ],
          });
        } else {
          const participantCount = await getServerAutoShareParticipantsCount(
            guildId
          );
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
                  You can configure auto-share with `/server auto-share
                  configure`.
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
                  serverAutoShareConfig.enabled ? "enabled" : "disabled"
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
        const enabled = interaction.options.getBoolean("enabled") as boolean;
        const channel =
          interaction.options.getChannel<ChannelType.GuildText>("channel")!;
        const format = interaction.options.getString(
          "format"
        ) as AutoShareWorkoutFormat;
        await upsertServer(guildId);

        await saveAutoShareConfig(
          guildId,
          enabled,
          channel as unknown as TextChannel,
          format
        );

        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [<TextDisplay>Settings saved.</TextDisplay>],
        });

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
