import {
  ActionRow,
  ButtonKit,
  ChannelSelectMenu,
  ChatInputCommandContext,
  Command,
  CommandData,
  CommandMetadata,
  Container,
  StringSelectMenu,
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
  ChannelType,
  Colors,
  InteractionContextType,
  MessageFlags,
  subtext,
} from "discord.js";

enum AutoShareWorkoutFormat {
  Line,
  BitDetailed,
  FullDetails,
}

const AUTOSHARE_WORKOUT_FORMAT_LABELS: Record<AutoShareWorkoutFormat, string> =
  {
    [AutoShareWorkoutFormat.Line]: "Just a line",
    [AutoShareWorkoutFormat.BitDetailed]: "Just some details",
    [AutoShareWorkoutFormat.FullDetails]: "Full details!",
  };

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
          name: "set",
          description: "Configure auto-share feature.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "active",
              description:
                "Should auto-share be active and sending new workouts?",
              type: ApplicationCommandOptionType.Boolean,
              required: true,
            },
            {
              name: "channel",
              description: "Destination channel",
              type: ApplicationCommandOptionType.Channel,
              required: true,
            },
            // {
            //   name: "mode",
            //   description: "Choose a frequency",
            //   type: ApplicationCommandOptionType.String,
            //   choices: [
            //     { name: "Real-time", value: "real-time" },
            //     { name: "Daily", value: "daily" },
            //     { name: "Weekly", value: "real-time" },
            //   ],
            //   required: true,
            // },
            {
              name: "format",
              description: "What does the message look like?",
              type: ApplicationCommandOptionType.String,
              choices: Object.entries(AUTOSHARE_WORKOUT_FORMAT_LABELS).map(
                ([name, value]) => ({
                  name,
                  value,
                })
              ),

              required: true,
            },
            {
              name: "mention",
              description:
                "Who should Chevy ping when sharing? (Leave empty to disable)",
              type: ApplicationCommandOptionType.Role,
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

export async function chatInput({
  interaction,
  store,
}: ChatInputCommandContext) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup == "auto-share") {
    switch (subcommand) {
      case "info":
        const active = true;
        const channelId = "1418237114470109376";
        const mode = AutoShareWorkoutFormat.Line;
        const participantCount = 23;
        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: (
            <>
              <TextDisplay>
                Auto-share allows Chevy to share automatically a workout
                whenever a member completes their Hevy workout.
              </TextDisplay>
              <TextDisplay>## Current settings</TextDisplay>

              <Container accentColor={Colors.DarkButNotBlack}>
                <TextDisplay content={`Auto-share status`} />
                <StringSelectMenu
                  customId="autoShareStatusSelect"
                  maxValues={1}
                  minValues={1}
                  onSelect={() => {}}
                >
                  <StringSelectMenuOption
                    label="Active"
                    value="active"
                    default={active}
                  />
                  <StringSelectMenuOption
                    label="Inactive"
                    value="nactive"
                    default={!active}
                  />
                </StringSelectMenu>
              </Container>
              <Container accentColor={Colors.DarkButNotBlack}>
                <TextDisplay
                  content={`Destination channel : ${bold(
                    channelMention(channelId)
                  )}.`}
                />
                <ChannelSelectMenu channelTypes={[ChannelType.GuildText]} />
              </Container>
              <TextDisplay
                content={`Format : ${bold(
                  AUTOSHARE_WORKOUT_FORMAT_LABELS[mode]
                )}.`}
              />
              <TextDisplay>
                {participantCount} are currently auto-sharing on this server.
              </TextDisplay>
              <ActionRow>
                {new ButtonKit()
                  .setLabel("Change settings")
                  .setStyle(ButtonStyle.Primary)
                  .setCustomId("changeAutoShareSettings")
                  .onClick(() => {}, { once: true })}
              </ActionRow>
            </>
          ),
        });
        break;

      case "set":
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
