import {
  ContainerBuilder,
  MessageFlags,
  TextChannel,
  TextDisplayBuilder,
  time,
  TimestampStyles,
  WebhookClient,
} from "discord.js";
import liveActivityConfig from "@/config/liveActivity.config";
import client from "@/app";
import { Logger } from "commandkit";

const webhookClient = new WebhookClient({
  url: liveActivityConfig.webhookUrl,
});

export const sendActivity = async (content: string) => {
  Logger.log("Sending activity message");

  webhookClient.send({
    content: `-# ${time(
      new Date(),
      TimestampStyles.RelativeTime
    )} - ${content}`,
    username: "Live Activity",
    avatarURL: client.user?.displayAvatarURL(),
  });
};
