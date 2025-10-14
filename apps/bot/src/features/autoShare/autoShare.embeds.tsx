import client from "@/app";
import {
  CommandKitModalBuilderInteractionCollectorDispatch,
  Container,
  ModalKit,
  ModalKitPredicate,
  Separator,
  TextDisplay,
} from "commandkit";
import {
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  ContainerBuilder,
  LabelBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  bold,
  channelMention,
  underline,
} from "discord.js";
import { commandMention } from "../discord/command.service";
import { ServerWithAutoShareConfig } from "./autoShare.types";
import { ServerAutoShareConfig, WorkoutFormat } from "@repo/db";

export const listServers = (
  servers: ServerWithAutoShareConfig[],
  currentServerId: string | null,
) => {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### Servers where your workouts are auto-shared :`,
    ),
    new TextDisplayBuilder().setContent(
      servers.length == 0
        ? "None!"
        : servers
            .map((server) => {
              let text = "- ";
              text += client.guilds.cache.get(server.guildId)!.name;

              if (currentServerId && server.guildId == currentServerId) {
                text += " " + bold("(this server)");
              }

              text += ` in ${channelMention(server.ServerAutoShareConfig!.channelId!)}`;

              return text;
            })
            .join("\n"),
    ),
  );
};

export const configModal = (
  filter: ModalKitPredicate,
  onSubmit: CommandKitModalBuilderInteractionCollectorDispatch,
  currentConfig: ServerAutoShareConfig | null,
) =>
  new ModalKit()
    .setCustomId("server-configure-modal")
    .setTitle("Auto-share configuration")
    .filter(filter)
    .onSubmit(onSubmit)

    .addLabelComponents([
      new LabelBuilder()
        .setLabel("Status")
        .setDescription(
          "Should Chevy automatically share workouts from your members?",
        )
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setRequired(true)
            .addOptions([
              new StringSelectMenuOptionBuilder()
                .setEmoji("✅")
                .setLabel("Enabled")
                .setValue("true")
                .setDefault(currentConfig?.enabled ?? false),
              new StringSelectMenuOptionBuilder()
                .setEmoji("❌")
                .setLabel("Disabled")
                .setValue("false")
                .setDefault(!currentConfig?.enabled),
            ])
            .setCustomId("config-enabled-select"),
        ),
      new LabelBuilder()
        .setLabel("Destination")
        .setDescription("Where the new workouts will be automatically shared.")
        .setChannelSelectMenuComponent(
          new ChannelSelectMenuBuilder()
            .setRequired(true)
            .setMaxValues(1)
            .setMinValues(1)
            .setDefaultChannels(currentConfig ? [currentConfig.channelId!] : [])
            .addChannelTypes([ChannelType.GuildText])
            .setCustomId("config-channel-select")
            .setPlaceholder("Select a channel"),
        ),
      new LabelBuilder()
        .setLabel("Format")
        .setDescription("What format should the workout be in?")
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setRequired(true)
            .addOptions(
              Object.entries(WorkoutFormat).map(([_, value]) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(value)
                  .setValue(value)
                  .setDefault(currentConfig?.workoutFormat == value),
              ),
            )
            .setCustomId("config-format-select"),
        ),
    ]);

export const configInfosContainer = async (
  serverAutoShareConfig: ServerAutoShareConfig | null,
  participantCount: number,
) => (
  <Container
    accentColor={serverAutoShareConfig?.enabled ? Colors.Green : Colors.Orange}
  >
    <TextDisplay>
      {`## ${serverAutoShareConfig?.enabled ? "✅" : "❌"} Auto-share is currently ${underline(serverAutoShareConfig?.enabled ? "enabled" : "disabled")} on this server.`}
    </TextDisplay>
    <Separator />
    {serverAutoShareConfig?.enabled ? (
      <>
        <TextDisplay>
          {serverAutoShareConfig!.channelId
            ? `New workouts will be shared in: ${channelMention(serverAutoShareConfig!.channelId)}`
            : `No destination channel for new workouts is set up.\nUse ${await commandMention("server auto-share configure")} to select a channel! ${bold("Auto-share won't work until you do.")}`}
        </TextDisplay>
        <TextDisplay>
          {`Workouts will be shared in a the format: \`${serverAutoShareConfig?.workoutFormat}\`.`}
        </TextDisplay>
        <Separator />
        <TextDisplay>
          -# Server members currently particiapating: `{participantCount}`
        </TextDisplay>
      </>
    ) : (
      <TextDisplay>{`Use ${await commandMention("server auto-share configure")} to set-up auto-share on this server.`}</TextDisplay>
    )}
  </Container>
);
