import { ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { generatePrivateFollowInstructionsComponents } from "./verification.embeds";
import { User } from "../../../../../packages/database/generated/prisma";

export const successfulyLinkedToHevy = async (user: User, already: boolean) => {
  let components: (ContainerBuilder | TextDisplayBuilder)[] = [
    new ContainerBuilder().addTextDisplayComponents(
      // TODO : add unlink instructions ?
      already
        ? new TextDisplayBuilder().setContent(
            `You are already linked to Hevy as **@${user.hevyUsername}**!`,
          )
        : new TextDisplayBuilder().setContent(
            `✅  You are successfully linked to Hevy as **@${user.hevyUsername}**!`,
          ),
    ),
  ];

  if (user.hevyProfilePrivate) {
    const privateLinkingComponenents =
      await generatePrivateFollowInstructionsComponents(user);

    components = [...components, ...privateLinkingComponenents];
  }

  return components;
};
