import { calculateHandicap, scoreDifferential } from '../src/lib/handicap'

function round (id, day, score, extra = {}) {
  return { id, date_played: `2026-05-${String(day).padStart(2, '0')}`, score, holes: 18, ...extra }
}

describe('scoreDifferential', () => {
  test('uses (113 / slope) x (score - course rating) when both are known', () => {
    expect(scoreDifferential({ score: 90, course_rating: 71, slope: 130 })).toEqual({
      value: 16.5,
      basis: 'rating_slope'
    })
  })

  test('falls back to score minus par when only par is known', () => {
    expect(scoreDifferential({ score: 92, par: 72 })).toEqual({ value: 20, basis: 'par' })
  })

  test('returns null with no score, or nothing to compare the score to', () => {
    expect(scoreDifferential({ par: 72 })).toBeNull()
    expect(scoreDifferential({ score: 92 })).toBeNull()
  })
})

describe('calculateHandicap', () => {
  test('needs at least three usable rounds', () => {
    const result = calculateHandicap([round('a', 1, 90, { par: 72 }), round('b', 2, 88, { par: 72 })])
    expect(result.index).toBeNull()
    expect(result.roundsNeeded).toBe(1)
  })

  test('three rounds: lowest differential minus 2.0', () => {
    const result = calculateHandicap([
      round('a', 1, 90, { par: 72 }),
      round('b', 2, 86, { par: 72 }),
      round('c', 3, 95, { par: 72 })
    ])
    expect(result.roundsUsed).toBe(1)
    expect(result.index).toBe(12) // (86 - 72) - 2.0
  })

  test('twenty rounds: average of the best eight, no adjustment', () => {
    const rounds = Array.from({ length: 20 }, (_, i) => round(`r${i}`, i + 1, 80 + i, { par: 72 }))
    const result = calculateHandicap(rounds)
    // differentials 8..27, best eight are 8..15, mean 11.5
    expect(result.roundsUsed).toBe(8)
    expect(result.index).toBe(11.5)
  })

  test('only the most recent twenty rounds count', () => {
    const old = round('old', 1, 60, { par: 72 }) // a very good round, but the 21st most recent
    const rounds = [old, ...Array.from({ length: 20 }, (_, i) => ({ ...round(`r${i}`, i + 2, 100, { par: 72 }), date_played: `2026-06-${String(i + 1).padStart(2, '0')}` }))]
    const result = calculateHandicap(rounds)
    expect(result.roundsConsidered).toBe(20)
    expect(result.index).toBe(28)
  })

  test('skips 9-hole rounds and rounds with no par or rating, and says why', () => {
    const result = calculateHandicap([
      round('a', 1, 90, { par: 72 }),
      round('b', 2, 45, { par: 36, holes: 9 }),
      round('c', 3, 92),
      round('d', 4, 88, { par: 72 }),
      round('e', 5, 91, { par: 72 })
    ])
    expect(result.skipped).toEqual([
      { id: 'b', reason: 'not_18_holes' },
      { id: 'c', reason: 'no_par_or_rating' }
    ])
    expect(result.roundsConsidered).toBe(3)
  })

  test('marks the result an estimate unless every counted round has rating and slope', () => {
    const withRating = (id, day, score) => round(id, day, score, { course_rating: 72, slope: 113 })
    const official = calculateHandicap([withRating('a', 1, 90), withRating('b', 2, 86), withRating('c', 3, 95)])
    expect(official.basis).toBe('rating_slope')

    // only the single lowest differential counts with three rounds, and here it is the par-only one
    const estimate = calculateHandicap([round('a', 1, 80, { par: 72 }), withRating('b', 2, 86), withRating('c', 3, 95)])
    expect(estimate.roundsUsed).toBe(1)
    expect(estimate.basis).toBe('estimate')
  })

  test('clamps to the 0-54 range the profile accepts, and reports it', () => {
    const rounds = [round('a', 1, 70, { par: 72 }), round('b', 2, 71, { par: 72 }), round('c', 3, 72, { par: 72 })]
    const result = calculateHandicap(rounds)
    expect(result.unclamped).toBe(-4)
    expect(result.index).toBe(0)
    expect(result.clamped).toBe(true)
  })

  test('ignores rounds that have no score at all (marks and legacy entries)', () => {
    const result = calculateHandicap([{ id: 'x', date_played: '2026-05-01', rating: 4 }])
    expect(result.roundsConsidered).toBe(0)
    expect(result.skipped).toEqual([])
  })
})
