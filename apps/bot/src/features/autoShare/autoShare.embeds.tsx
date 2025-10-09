import client from "@/app";
import {
  ChannelSelectMenuBuilder,
  ChannelType,
  ContainerBuilder,
  LabelBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  bold,
  channelMention,
} from "discord.js";
import { ServerWithAutoShareConfig } from "./autoShare.types";
import {
  CommandKitModalBuilderInteractionCollectorDispatch,
  ModalKit,
  ModalKitPredicate,
} from "commandkit";
import { AutoShareWorkoutFormat } from "@repo/db";
import handler from "@/app/events/clientReady/log";

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
                .setValue("true"),
              new StringSelectMenuOptionBuilder()
                .setEmoji("❌")
                .setLabel("Disabled")
                .setValue("false"),
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
              Object.entries(AutoShareWorkoutFormat).map(([key, value]) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(value)
                  .setValue(key),
              ),
            )
            .setCustomId("config-format-select"),
        ),
    ]);
