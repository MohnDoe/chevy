import { ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { HevyVerification } from "../../../../../packages/database/generated/prisma";

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
