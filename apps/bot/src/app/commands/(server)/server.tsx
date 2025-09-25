import { prisma } from "@repo/db";
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
  ChannelSelectMenuInteraction,
  ChannelType,
  Colors,
  InteractionContextType,
  MessageFlags,
  SeparatorSpacingSize,
  StringSelectMenuInteraction,
} from "discord.js";
import { AutoShareWorkoutFormat } from "../../../../../../packages/database/generated/prisma";
import { upsertServer } from "@/features/core/server.service";

const AUTOSHARE_WORKOUT_FORMAT_LABELS: Record<AutoShareWorkoutFormat, string> =
  {
    [AutoShareWorkoutFormat.line]: "Just a line",
    [AutoShareWorkoutFormat.compact]: "Just some details",
    [AutoShareWorkoutFormat.detailed]: "Full details!",
  };

export const metadata: CommandMetadata = {
  userPermissions: ["ManageGuild"],
};

const _active = true;
const _channelId = "1418237114470109376";
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
        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: settingsComponents(),
        });
        break;

      case "set":
        await upsertServer(interaction.guildId!);
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

const handleSettingsChange = async (
  interaction: StringSelectMenuInteraction | ChannelSelectMenuInteraction,
  context: StringSelectMenuKit | ChannelSelectMenuKit
) => {
  await interaction.deferUpdate();
  await interaction.editReply({
    components: settingsComponents(),
  });
};

const settingsComponents = () => {
  return (
    <>
      <TextDisplay>
        Auto-share allows Chevy to share automatically a workout whenever a
        member completes their Hevy workout.
      </TextDisplay>
      <Separator spacing={SeparatorSpacingSize.Large} />
      <TextDisplay>## Current settings</TextDisplay>
      <Container accentColor={Colors.DarkButNotBlack}>
        <TextDisplay content={`### Auto-share status`} />
        <ActionRow>
          <StringSelectMenu
            customId={`autoShareStatusSelect---${new Date().toISOString()}`}
            maxValues={1}
            minValues={1}
            onSelect={(i, c) =>
              handleSettingsChange(
                i as unknown as StringSelectMenuInteraction,
                c
              )
            }
            onEnd={console.log}
          >
            <StringSelectMenuOption
              label="Active"
              value="active"
              default={_active}
            />
            <StringSelectMenuOption
              label="Inactive"
              value="nactive"
              default={!_active}
            />
          </StringSelectMenu>
        </ActionRow>
        <Separator divider={false} />
        <TextDisplay content={`### Destination channel`} />
        <ActionRow>
          <ChannelSelectMenu
            customId={`autoShareChannelSelect---${new Date().toISOString()}`}
            channelTypes={[ChannelType.GuildText]}
            // defaultValues={[
            //   {
            //     type: SelectMenuDefaultValueType.Channel,
            //     id: channelId,
            //   },
            // ]}
            onSelect={(i, c) =>
              handleSettingsChange(
                i as unknown as ChannelSelectMenuInteraction,
                c
              )
            }
            onEnd={console.log}
          />
        </ActionRow>
        <Separator divider={false} />
        <TextDisplay content={`### Format`} />
        <ActionRow>
          <StringSelectMenu
            customId={`autoShareFormatSelect---${new Date().toISOString()}`}
            maxValues={1}
            minValues={1}
            onSelect={(i, c) =>
              handleSettingsChange(
                i as unknown as StringSelectMenuInteraction,
                c
              )
            }
            onEnd={console.log}
          >
            {Object.entries(AUTOSHARE_WORKOUT_FORMAT_LABELS).map(
              ([key, value]) => (
                <StringSelectMenuOption
                  label={value}
                  value={key}
                  default={key == _mode.toString()}
                />
              )
            )}
          </StringSelectMenu>
        </ActionRow>
      </Container>
      <TextDisplay>
        {_participantCount} members are currently auto-sharing on this server.
      </TextDisplay>
      <ActionRow>
        {new ButtonKit()
          .setLabel("Save")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("changeAutoShareSettings")
          .onClick(() => {}, { once: true })}

        {new ButtonKit()
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("cancelAutoShareSettings")
          .onClick(() => {}, { once: true })}
      </ActionRow>
    </>
  );
};
