import { ContainerBuilder, TextDisplayBuilder, ButtonStyle } from "discord.js";
import { checkIfUserUserIsFollowedByBot } from "./hevy.api";
import { ButtonKit } from "commandkit";
import { setUserHevyUsername, setIsFollowedByHevyBot } from "./hevy.service";
import { User } from "../../../../../packages/database/generated/prisma";

export const generatePrivateFollowInstructionsComponents = async (
  user: User,
) => {
  const userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
    user.hevyUsername!,
  );

  let components: (ContainerBuilder | TextDisplayBuilder)[] = [
    userIsFollowedByHevyBot
      ? new ContainerBuilder().addTextDisplayComponents(
          getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot),
        )
      : new ContainerBuilder().addSectionComponents((section) =>
          section
            .addTextDisplayComponents(
              getFollowedByHevyBotTextComponent(userIsFollowedByHevyBot),
            )
            .setButtonAccessory(
              refreshFollowedStatusButtonComponent(
                userIsFollowedByHevyBot,
                user.hevyUsername!,
                user,
              ),
            ),
        ),
  ];

  if (!userIsFollowedByHevyBot) {
    components = [
      ...components,
      new TextDisplayBuilder().setContent(
        `Your account is set to private, the bot (@${process.env
          .BOT_ON_HEVY_USERNAME!} on Hevy) won't have access to your workouts, routines, etc. if you are not mutual followers.
        
A follow request was sent out to your account, you need to accept it to proceed.`,
      ),
    ];
  }

  return components;
};
const refreshFollowedStatusButtonComponent = (
  isFollowed: boolean,
  targetHevyUsername: string,
  user: User,
) =>
  new ButtonKit()
    .setLabel(isFollowed ? "Followed" : "Check")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(isFollowed ? "✅" : "🔄")
    .setCustomId("refreshFollowedStatusButton")
    .setDisabled(isFollowed)
    .onClick(async (interaction, context) => {
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      const userIsFollowedByHevyBot = await checkIfUserUserIsFollowedByBot(
        targetHevyUsername!,
      );

      if (userIsFollowedByHevyBot) {
        await setUserHevyUsername(interaction.user.id, targetHevyUsername!);
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      context.dispose();
      await interaction.editReply({
        components: await generatePrivateFollowInstructionsComponents(user),
      });
    });
const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅" : "⏳"}  Accept follow request from @${
      process.env.BOT_ON_HEVY_USERNAME
    }`,
  );
