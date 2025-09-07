import { EmbedBuilder } from "discord.js";
import { HevyExercise } from "../../types/hevy/exercise.type"
import { HevyWorkout } from "../../types/hevy/workout.type"
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration'
import { HevySet } from "../../types/hevy/set.type";
dayjs.extend(duration)

const SUPERSETS_PREFIXES = [
  '🟪',
  '🟩',
  '🟥',
  '🟨',
  '⬛',
  '🟧',
  '🟦',
  '🟫',
  '⬜',
  '🟣',
  '🟢',
  '🔴',
  '🟡',
  '⚫',
  '🟠',
  '🔵',
  '🟤',
  '⚪',
]

const getExerciseVolume = (ex: HevyExercise) => {
  return ex.sets.reduce((a, set) => a + (set.weight_kg || 0) * (set.reps || 1), 0)
}

export const embedWorkout = (workout: HevyWorkout) => {
  const setCount = workout.exercises.reduce((acc, exercise) => acc + exercise.sets.length, 0)

  const prCount = workout.exercises.reduce(
    (acc, ex) =>
      acc + ex.sets.reduce((a, s) => a + s.personalRecords.length, 0),
    0
  )

  const volume = workout.exercises.reduce((acc, exercise) => acc + getExerciseVolume(exercise), 0)

  const workoutDuration = dayjs.duration(workout.end_time - workout.start_time, 'seconds')

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
      name: 'Duration',
      value: `${workoutDuration.format('H[h] mm[m]')}`,
      inline: true,
    })

  if (volume > 0) {
    embed.addFields({
      name: 'Volume',
      value: `${new Intl.NumberFormat('en-US').format(volume)} Kg`,
      inline: true,
    })
  }
  if (setCount > 0) {
    embed.addFields({
      name: 'Sets',
      value: setCount + '',
      inline: true,
    })
  }

  if (prCount > 0) {
    embed.addFields({
      name: 'Records',
      value: prCount + ' 🏆',
      inline: true,
    })
  }

  embed
    .setThumbnail(workout.image_urls.length ? workout.image_urls[0] : null)
    .addFields(workout.exercises.map((e) => exerciseToEmbedField(e)))
    .setTimestamp(workout.start_time * 1000)
    .setFooter({
      text: `${integerToPositionString(workout.nth_workout)} workout`,
    })

  return embed
}


const exerciseToEmbedField = (exercise: HevyExercise) => {
  let title = ''

  if (exercise.superset_id) {
    title += SUPERSETS_PREFIXES[exercise.superset_id]
      ? `${SUPERSETS_PREFIXES[exercise.superset_id]} `
      : ''
  }

  title += exercise.title
  const volume = getExerciseVolume(exercise)
  const showSetNumber = exercise.sets.length > 1
  if (volume > 0) {
    title += ` [${new Intl.NumberFormat('en-US').format(volume)} kg]`
  }

  let value = ''

  if (exercise.notes) {
    value += `*${exercise.notes}*\n`
  }

  return {
    name: title,
    value:
      value +
      exercise.sets.map((s, i) => setToString(s, i + 1, showSetNumber)).join('\n'),
  }
}

const setToString = (set: HevySet, setNumber:number, showSetNumber = true) => {
  const indicator = {
    normal: null,
    warmup: '[Warm-up]',
    dropset: '[Dropset]',
    failure: '[Failure]',
  }

  let string = ''
  if (showSetNumber) {
    string += `Set ${setNumber}: `
  }

  if (set.reps) {
    if (set.weight_kg) {
      string += `${set.weight_kg} kg x ${set.reps}`
    } else {
      string += `${set.reps} reps`
    }
  } else if (set.duration_seconds) {
    if (set.distance_meters) {
      string += `${set.distance_meters / 1000} km`
    }
    const setDuration = dayjs.duration(set.duration_seconds, 'seconds')
    string += ` - ${setDuration.format(
      `m${setDuration.get('seconds') > 0 ? '[:]ss' : ''}[min]`
    )}`
  }

  if (set.rpe) {
    string += ` @ *${set.rpe} rpe*`
  }

  if (set.indicator !== null && indicator[set.indicator]) {
    string += ` **${indicator[set.indicator]}**`
  }

  if (set.prs.length) {
    string += ` - 🏆 `
    string += set.prs
      .map((pr) => {
        switch (pr.type) {
          case 'best_distance':
            return `Best Distance (${pr.value / 1000} km)`
          case 'best_weight':
            return `Best Weight (${pr.value} kg)`
          default:
            return 'Personal Best'
        }
      })
      .join(' | ')
    string += ``
  }

  return string
}

const integerToPositionString = (number: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const value = number % 100
  return (
    number + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0])
  )
}