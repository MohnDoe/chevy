import {
  blockQuote,
  bold,
  ButtonStyle,
  ComponentBuilder,
  ContainerBuilder,
  ContainerComponent,
  EmbedBuilder,
  hyperlink,
  inlineCode,
  quote,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  subtext,
  TextDisplayBuilder,
  ThumbnailBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { HevyExercise } from "../../types/hevy/exercise.type";
import { HevyWorkout } from "../../types/hevy/workout.type";
import { HevySet } from "../../types/hevy/set.type";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";

dayjs.extend(duration);
dayjs.extend(localizedFormat);

const SUPERSETS_PREFIXES = [
  "🟪",
  "🟩",
  "🟥",
  "🟨",
  "⬛",
  "🟧",
  "🟦",
  "🟫",
  "⬜",
  "🟣",
  "🟢",
  "🔴",
  "🟡",
  "⚫",
  "🟠",
  "🔵",
  "🟤",
  "⚪",
];

const getExerciseVolume = (ex: HevyExercise) => {
  return ex.sets.reduce(
    (a, set) => a + (set.weight_kg || 0) * (set.reps || 1),
    0
  );
};

export const toComponent = (
  workout: HevyWorkout,
  size: "small"
): ContainerBuilder => {
  const setCount = workout.exercises.reduce(
    (acc, exercise) => acc + exercise.sets.length,
    0
  );

  const prCount = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((a, s) => a + s.prs.length, 0),
    0
  );

  const volume = workout.exercises.reduce(
    (acc, exercise) => acc + getExerciseVolume(exercise),
    0
  );

  const workoutDuration = dayjs.duration(
    workout.end_time - workout.start_time,
    "seconds"
  );

  let informationsText = `
**Duration**: ${workoutDuration.format("H[h] mm[m]")}
**Volume**: ${new Intl.NumberFormat("en-US").format(volume)} Kg
**Sets**: ${setCount}
`;

  if (prCount > 0) {
    informationsText += `**PRs**: ${prCount}`;
  }

  let container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### [${workout.name}](https://hevy.com/workout/${workout.short_id})`
      )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(informationsText)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(workout.profile_image)
        )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(false)
    );

  for (const [i, exercise] of workout.exercises.entries()) {
    const exerciseVolume = getExerciseVolume(exercise);
    let exerciseTitle = "";

    if (exercise.superset_id) {
      exerciseTitle += SUPERSETS_PREFIXES[exercise.superset_id]
        ? `${SUPERSETS_PREFIXES[exercise.superset_id]} `
        : "";
    }
    exerciseTitle += exercise.title;
    if (exerciseVolume > 0) {
      exerciseTitle += ` ${inlineCode(
        `${new Intl.NumberFormat("en-US").format(exerciseVolume)} kg`
      )}`;
    }

    exerciseTitle = `${bold(exerciseTitle)}`;

    if (exercise.notes) {
      exerciseTitle += `\n${quote(subtext(exercise.notes))}`;
    }

    // if (volume > 0) {
    //   exerciseSection = exerciseSection
    //     .addTextDisplayComponents(
    //       new TextDisplayBuilder().setContent(exerciseTitle)
    //     )
    //     .setButtonAccessory(
    //       new ButtonKit()
    //         .setDisabled(true)
    //         .setLabel(`${new Intl.NumberFormat("en-US").format(volume)} kg`)
    //         .setStyle(ButtonStyle.Secondary)
    //         .setCustomId(`${exercise.id}-${exercise.index}`)
    //     );
    // } else {
    container = container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(exerciseTitle)
    );
    // }

    const showSetNumber = exercise.sets.length > 1;
    let setsText = "";
    for (const [j, set] of exercise.sets.entries()) {
      setsText += subtext(setToTextDisplay(set, j + 1, showSetNumber));
      setsText += `\n`;
    }
    container = container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(setsText)
    );

    if (i < workout.exercises.length - 1) {
      container = container.addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(false)
      );
    }
  }

  container = container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
  );
  container = container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      subtext(
        `${hyperlink(
          `**@${workout.username}**`,
          `https://hevy.com/user/${workout.username}`
        )} • ${bold(
          integerToPositionString(workout.nth_workout)
        )} workout | ${time(
          workout.start_time,
          TimestampStyles.ShortDateTime
        )} • ${time(workout.start_time, TimestampStyles.RelativeTime)}
        `
      )
    )
  );

  return container;
};

export const embedWorkout = (workout: HevyWorkout) => {
  const setCount = workout.exercises.reduce(
    (acc, exercise) => acc + exercise.sets.length,
    0
  );

  const prCount = workout.exercises.reduce(
    (acc, ex) =>
      acc + ex.sets.reduce((a, s) => a + s.personalRecords.length, 0),
    0
  );

  const volume = workout.exercises.reduce(
    (acc, exercise) => acc + getExerciseVolume(exercise),
    0
  );

  const workoutDuration = dayjs.duration(
    workout.end_time - workout.start_time,
    "seconds"
  );

  const embed = new EmbedBuilder()
    .setTitle(workout.name)
    .setURL(`https://hevy.com/workout/${workout.short_id}`)
    .setAuthor({
      name: workout.username,
      iconURL: workout.profile_image,
      url: `https://hevy.com/user/${workout.username}`,
    })
    .setDescription(
      workout.description
        ? workout.description.trim().length != 0
          ? workout.description
          : null
        : null
    )
    .addFields({
      name: "Duration",
      value: `${workoutDuration.format("H[h] mm[m]")}`,
      inline: true,
    });

  if (volume > 0) {
    embed.addFields({
      name: "Volume",
      value: `${new Intl.NumberFormat("en-US").format(volume)} Kg`,
      inline: true,
    });
  }
  if (setCount > 0) {
    embed.addFields({
      name: "Sets",
      value: setCount + "",
      inline: true,
    });
  }

  if (prCount > 0) {
    embed.addFields({
      name: "Records",
      value: prCount + " 🏆",
      inline: true,
    });
  }

  embed
    .setThumbnail(workout.image_urls.length ? workout.image_urls[0] : null)
    .addFields(workout.exercises.map((e) => exerciseToEmbedField(e)))
    .setTimestamp(workout.start_time * 1000)
    .setFooter({
      text: `${integerToPositionString(workout.nth_workout)} workout`,
    });

  return embed;
};

const exerciseToEmbedField = (exercise: HevyExercise) => {
  let title = "";

  if (exercise.superset_id) {
    title += SUPERSETS_PREFIXES[exercise.superset_id]
      ? `${SUPERSETS_PREFIXES[exercise.superset_id]} `
      : "";
  }

  title += exercise.title;
  const volume = getExerciseVolume(exercise);
  const showSetNumber = exercise.sets.length > 1;
  if (volume > 0) {
    title += ` [${new Intl.NumberFormat("en-US").format(volume)} kg]`;
  }

  let value = "";

  if (exercise.notes) {
    value += `*${exercise.notes}*\n`;
  }

  return {
    name: title,
    value:
      value +
      exercise.sets
        .map((s, i) => setToString(s, i + 1, showSetNumber))
        .join("\n"),
  };
};

const setToTextDisplay = (
  set: HevySet,
  setNumber: number,
  showSetNumber = true
) => {
  const indicator = {
    normal: null,
    warmup: "[Warm-up]",
    dropset: "[Dropset]",
    failure: "[Failure]",
  };

  let string = "";
  if (showSetNumber) {
    string += `Set ${setNumber}: `;
  }

  if (set.reps) {
    if (set.weight_kg) {
      string += `${set.weight_kg.toFixed(0)} kg x ${set.reps}`; //TODO
    } else {
      string += `${set.reps} reps`;
    }
  } else if (set.duration_seconds) {
    if (set.distance_meters) {
      string += `${set.distance_meters / 1000} km`;
    }
    const setDuration = dayjs.duration(set.duration_seconds, "seconds");
    string += ` - ${setDuration.format(
      `m${setDuration.get("seconds") > 0 ? "[:]ss" : ""}[min]`
    )}`;
  }

  if (set.rpe) {
    string += ` @ *${set.rpe} rpe*`;
  }

  if (set.indicator !== null && indicator[set.indicator]) {
    string += ` **${indicator[set.indicator]}**`;
  }

  if (set.prs.length) {
    string += ` - 🏆 `;
    string += set.prs
      .map((pr) => {
        switch (pr.type) {
          case "best_distance":
            return `Best Distance (${pr.value / 1000} km)`;
          case "best_weight":
            return `Best Weight (${pr.value.toFixed(0)} kg)`; //TODO
          default:
            return "Personal Best";
        }
      })
      .join(" | ");
    string += ``;
  }

  return string;
};

const setToString = (set: HevySet, setNumber: number, showSetNumber = true) => {
  const indicator = {
    normal: null,
    warmup: "[Warm-up]",
    dropset: "[Dropset]",
    failure: "[Failure]",
  };

  let string = "";
  if (showSetNumber) {
    string += `Set ${setNumber}: `;
  }

  if (set.reps) {
    if (set.weight_kg) {
      string += `${set.weight_kg} kg x ${set.reps}`;
    } else {
      string += `${set.reps} reps`;
    }
  } else if (set.duration_seconds) {
    if (set.distance_meters) {
      string += `${set.distance_meters / 1000} km`;
    }
    const setDuration = dayjs.duration(set.duration_seconds, "seconds");
    string += ` - ${setDuration.format(
      `m${setDuration.get("seconds") > 0 ? "[:]ss" : ""}[min]`
    )}`;
  }

  if (set.rpe) {
    string += ` @ *${set.rpe} rpe*`;
  }

  if (set.indicator !== null && indicator[set.indicator]) {
    string += ` **${indicator[set.indicator]}**`;
  }

  if (set.prs.length) {
    string += ` - 🏆 `;
    string += set.prs
      .map((pr) => {
        switch (pr.type) {
          case "best_distance":
            return `Best Distance (${pr.value / 1000} km)`;
          case "best_weight":
            return `Best Weight (${pr.value} kg)`;
          default:
            return "Personal Best";
        }
      })
      .join(" | ");
    string += ``;
  }

  return string;
};

const integerToPositionString = (number: number) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = number % 100;
  return (
    number + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0])
  );
};
