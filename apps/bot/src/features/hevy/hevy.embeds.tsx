import { HevyVerification } from "@repo/db";
import { ContainerBuilder, TextDisplayBuilder } from "discord.js";

export const successfulyLinkedToHevy = (
  userVerification: HevyVerification,
  already: boolean,
) => {
  let components: (ContainerBuilder | TextDisplayBuilder)[] = [
    new ContainerBuilder().addTextDisplayComponents(
      // TODO : add unlink instructions ?
      already
        ? new TextDisplayBuilder().setContent(
            `✅ You are already linked to Hevy as **@${userVerification.username}**!`,
          )
        : new TextDisplayBuilder().setContent(
            `✅ You are successfully linked to Hevy as **@${userVerification.username}**!`,
          ),
    ),
  ];

  return components;
};
