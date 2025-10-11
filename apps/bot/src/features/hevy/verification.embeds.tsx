import { ButtonKit } from "commandkit";
import {
  bold,
  ButtonStyle,
  ContainerBuilder,
  hyperlink,
  SeparatorBuilder,
  subtext,
  TextDisplayBuilder,
} from "discord.js";
import { HevyVerification } from "../../../../../packages/database/generated/prisma";
import { commandMention } from "../discord/command.service";
import { checkIfUserUserIsFollowedByBot } from "./hevy.api";
import { setIsFollowedByHevyBot } from "./hevy.service";

export const generatePrivateFollowInstructionsComponents = async (
  userVerification: HevyVerification,
  isFollowedByHevyBot: boolean,
) => {
  let components: (ContainerBuilder | TextDisplayBuilder | SeparatorBuilder)[] =
    [];

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
                refreshFollowedStatusButtonComponent(
                  userVerification,
                  isFollowedByHevyBot,
                ),
              ),
          ),
    ],
  ];

  return components;
};

const refreshFollowedStatusButtonComponent = (
  userVerification: HevyVerification,
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
        userVerification.username!,
      );

      if (isFollowedNow) {
        await setIsFollowedByHevyBot(interaction.user.id, true);
      }

      context.dispose();
      await interaction.editReply({
        components: await generatePrivateFollowInstructionsComponents(
          userVerification,
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
export const generateLinkingInstructions = async (
  userVerification: HevyVerification,
) => {
  let components: (TextDisplayBuilder | ContainerBuilder | SeparatorBuilder)[] =
    [
      new TextDisplayBuilder().setContent(
        "# Welcome to your Hevy companion bot !",
      ),
      new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `In order to link your Hevy account (@${userVerification.username}) to Chevy you need to follow these simple steps:`,
            `1. Go to the comment section of ${hyperlink("this workout", `https://hevy.com/workout/${userVerification.workoutId}`)}.`,
            `2. Comment with \`${userVerification.verificationCode}\` **(nothing else, just that!)**`,
            `3. Wait for verification, bot will check for new verification every **5 minutes**.`,
            `4. If everything is fine, the bot has read your comment, your account is verified. And a message will be sent to you.`,
          ].join("\n"),
        ),
      ),
      new TextDisplayBuilder().setContent(
        subtext(
          `If after 15 minutes the bot haven't message you yet, you can re-run the command ${await commandMention("hevy link")}!`,
        ),
      ),
      new TextDisplayBuilder().setContent(
        bold(
          `If your profile is set to private, a follow request will be sent to your account. You will have to accept it!`,
        ),
      ),
    ];

  return components;
};
