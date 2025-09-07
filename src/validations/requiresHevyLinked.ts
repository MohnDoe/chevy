import type { ValidationProps } from "commandkit";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export default function ({
  interaction,
  commandObj,
  handler,
}: ValidationProps) {
  if (commandObj.options?.requiresHevyLinking) {
    console.log("Command requires linking to Hevy");
    (interaction as ChatInputCommandInteraction).reply({
      content: "You are not linked to Hevy yet",
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }
}
