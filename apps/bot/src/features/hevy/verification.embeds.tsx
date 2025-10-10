import { ButtonKit } from "commandkit";
import {
  ButtonStyle,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { User } from "../../../../../packages/database/generated/prisma";
import { checkIfUserUserIsFollowedByBot } from "./hevy.api";
import { setIsFollowedByHevyBot } from "./hevy.service";

export const generatePrivateFollowInstructionsComponents = async (
  user: User,
  isFollowedByHevyBot: boolean,
) => {
  let components: (ContainerBuilder | TextDisplayBuilder | SeparatorBuilder)[] =
    [new SeparatorBuilder().setDivider(true)];

  if (!isFollowedByHevyBot) {
    components = [
      ...components,
      ...[
        new TextDisplayBuilder().setContent(
          `Your account is set to private, the bot (@${process.env
            .BOT_ON_HEVY_USERNAME!} on Hevy) won't have access to your workouts, routines, etc. if you are not mutual followers.
        
A follow request was sent out to your account, you need to accept it to proceed.`,
        ),
      ],
    ];
  }

  components = [
    ...components,
    ...[
      isFollowedByHevyBot
        ? new ContainerBuilder().addTextDisplayComponents(
            getFollowedByHevyBotTextComponent(isFollowedByHevyBot),
          )
        : new ContainerBuilder().addSectionComponents((section) =>
            section
              .addTextDisplayComponents(
                getFollowedByHevyBotTextComponent(isFollowedByHevyBot),
              )
              .setButtonAccessory(
                refreshFollowedStatusButtonComponent(user, isFollowedByHevyBot),
              ),
          ),
    ],
  ];

  return components;
};

const refreshFollowedStatusButtonComponent = (
  user: User,
  isFollowed: boolean,
) => {
  return new ButtonKit()
    .setLabel(isFollowed ? "Followed" : "Check")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(isFollowed ? "✅" : "🔄")
    .setCustomId("refreshFollowedStatusButton")
    .setDisabled(isFollowed)
    .onClick(async (interaction, context) => {
      if (!interaction.deferred) {
        await interaction.deferUpdate({ withResponse: true });
      }

      const isFollowedNow = await checkIfUserUserIsFollowedByBot(
        user.hevyUsername!,
      );

      if (isFollowedNow) {
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      context.dispose();
      await interaction.editReply({
        components: await generatePrivateFollowInstructionsComponents(
          user,
          isFollowedNow,
        ),
      });
    });
};

const getFollowedByHevyBotTextComponent = (done: boolean) =>
  new TextDisplayBuilder().setContent(
    `${done ? "✅ Your private account is followed by " : "⏳ Accept follow request from "}` +
      ` ` +
      `@${process.env.BOT_ON_HEVY_USERNAME}`,
  );
