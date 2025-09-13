import { ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default (username: string) =>
  new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `✅  You are successfully linked to Hevy as **@${username}**!`
    )
  );
