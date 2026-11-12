// Suggests a handicap index from a golfer's logged rounds.
//
// This follows the World Handicap System shape (score differential per round,
// then an average of the best recent differentials) but it is an estimate, not
// an official index: it uses gross score (no net-double-bogey adjustment), assumes
// no playing-conditions adjustment, and only counts 18-hole rounds. An official
// index comes from your club. This is plain arithmetic on purpose: a model
// extracts the numbers from what a golfer typed, code does the maths.

const MAX_ROUNDS_CONSIDERED = 20
const MIN_ROUNDS = 3
const STANDARD_SLOPE = 113
const MIN_INDEX = 0
const MAX_INDEX = 54

// [rounds available, how many of the lowest differentials to average, adjustment]
const TABLE = [
  [3, 1, -2.0],
  [4, 1, -1.0],
  [5, 1, 0],
  [6, 2, -1.0],
  [7, 2, 0],
  [8, 2, 0],
  [9, 3, 0],
  [10, 3, 0],
  [11, 3, 0],
  [12, 4, 0],
  [13, 4, 0],
  [14, 4, 0],
  [15, 5, 0],
  [16, 5, 0],
  [17, 6, 0],
  [18, 6, 0],
  [19, 7, 0],
  [20, 8, 0]
]

function roundToTenth (value) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function isNumber (value) {
  return typeof value === 'number' && Number.isFinite(value)
}

// One round's score differential, or null when it cannot be worked out.
export function scoreDifferential (round) {
  if (!isNumber(round.score)) return null
  if (isNumber(round.course_rating) && isNumber(round.slope) && round.slope > 0) {
    return {
      value: roundToTenth((STANDARD_SLOPE / round.slope) * (round.score - round.course_rating)),
      basis: 'rating_slope'
    }
  }
  if (isNumber(round.par)) {
    return { value: roundToTenth(round.score - round.par), basis: 'par' }
  }
  return null
}

export function calculateHandicap (rounds = []) {
  const skipped = []
  const eligible = []

  for (const round of rounds) {
    if (!isNumber(round.score)) continue
    if (round.holes !== 18) {
      skipped.push({ id: round.id, reason: 'not_18_holes' })
      continue
    }
    const differential = scoreDifferential(round)
    if (!differential) {
      skipped.push({ id: round.id, reason: 'no_par_or_rating' })
      continue
    }
    eligible.push({ id: round.id, date: round.date_played, ...differential })
  }

  const recent = eligible
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, MAX_ROUNDS_CONSIDERED)

  const result = {
    index: null,
    unclamped: null,
    clamped: false,
    roundsConsidered: recent.length,
    roundsUsed: 0,
    roundsNeeded: Math.max(0, MIN_ROUNDS - recent.length),
    basis: null,
    differentials: recent,
    skipped
  }

  if (recent.length < MIN_ROUNDS) return result

  const [, count, adjustment] = TABLE[recent.length - MIN_ROUNDS]
  const best = [...recent].sort((a, b) => a.value - b.value).slice(0, count)
  const average = best.reduce((sum, d) => sum + d.value, 0) / best.length
  const unclamped = roundToTenth(average + adjustment)
  const index = Math.min(MAX_INDEX, Math.max(MIN_INDEX, unclamped))

  return {
    ...result,
    index,
    unclamped,
    clamped: index !== unclamped,
    roundsUsed: count,
    basis: best.every((d) => d.basis === 'rating_slope') ? 'rating_slope' : 'estimate'
  }
}
