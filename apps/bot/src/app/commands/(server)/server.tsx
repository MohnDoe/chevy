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
  CommandMetadata,
  Container,
  Separator,
  StringSelectMenuOption,
  TextDisplay,
} from "commandkit";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  bold,
  channelMention,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
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
                }),
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
        {
          name: "configure-modal",
          description: "Test configure via modal",
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
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral,
        });

        const enabled = interaction.options.getBoolean("enabled") as boolean;
        const channel =
          interaction.options.getChannel<ChannelType.GuildText>("channel")!;
        const format = interaction.options.getString(
          "format",
        ) as AutoShareWorkoutFormat;
        await upsertServer(guildId);

        await saveAutoShareConfig(
          guildId,
          enabled,
          channel as unknown as TextChannel,
          format,
        );

        await interaction.followUp({
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          components: [<TextDisplay>Settings saved.</TextDisplay>],
        });

        break;
      case "configure-modal":
        const modal = new ModalBuilder()
          .setCustomId("server-configure-modal")
          .setTitle("Auto-share configuration");

        modal.addLabelComponents([
          new LabelBuilder()
            .setLabel("Destination")
            .setChannelSelectMenuComponent(
              new ChannelSelectMenuBuilder()
                .addChannelTypes([ChannelType.GuildText])
                .setCustomId("test-channel")
                .setPlaceholder("select a channel"),
            ),
          new LabelBuilder()
            .setLabel("Format")

            .setStringSelectMenuComponent(
              new StringSelectMenuBuilder()
                .addOptions(
                  Object.entries(AutoShareWorkoutFormat).map(([key, value]) =>
                    new StringSelectMenuOptionBuilder()
                      .setLabel(value)
                      .setValue(key),
                  ),
                )
                .setCustomId("test-format"),
            ),
          new LabelBuilder()
            .setLabel("Enabled")

            .setStringSelectMenuComponent(
              new StringSelectMenuBuilder()
                .addOptions([
                  new StringSelectMenuOptionBuilder()
                    .setLabel("True")
                    .setValue("True"),
                  new StringSelectMenuOptionBuilder()
                    .setLabel("False")
                    .setValue("False"),
                ])
                .setCustomId("test-enabled"),
            ),
        ]);

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
