import { ContainerBuilder, TextDisplayBuilder } from "discord.js";

export const successfulyLinkedToHevy = (username: string, already: boolean) =>
  new ContainerBuilder().addTextDisplayComponents(
    // TODO : add unlink instructions ?
    already
      ? new TextDisplayBuilder().setContent(
          `You are already linked to Hevy as **@${username}**!`,
        )
      : new TextDisplayBuilder().setContent(
          `✅  You are successfully linked to Hevy as **@${username}**!`,
        ),
  );
