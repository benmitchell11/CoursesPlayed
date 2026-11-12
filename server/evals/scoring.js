// Scores one parsed round against what the case expects. Only fields listed in
// `expect` are checked, so a case can be about one thing (an injection, a date).

const FIELDS = ['date_played', 'score', 'holes', 'rating', 'par', 'slope', 'course_rating']

function courseOutcome (proposal) {
  if (proposal.course.best) return proposal.course.best.name
  return proposal.course.candidates.length > 1 ? 'ambiguous' : null
}

function scoreCase (proposal, expect) {
  const checks = []

  if ('course' in expect) {
    const got = courseOutcome(proposal)
    checks.push({ field: 'course', expected: expect.course, got, pass: got === expect.course })
  }

  for (const field of FIELDS) {
    if (!(field in expect)) continue
    const got = proposal.round[field] ?? null
    checks.push({ field, expected: expect[field], got, pass: got === expect[field] })
  }

  return { checks, pass: checks.every((c) => c.pass) }
}

function summarise (results) {
  const byField = {}
  for (const result of results) {
    for (const check of result.checks) {
      byField[check.field] ||= { pass: 0, total: 0 }
      byField[check.field].total += 1
      if (check.pass) byField[check.field].pass += 1
    }
  }
  const passed = results.filter((r) => r.pass).length
  return { cases: results.length, passed, byField }
}

// What a perfect model would return for a case, for testing the harness and the
// matching code without calling an API.
function goldExtraction (expect) {
  const has = (key) => (key in expect ? expect[key] : null)
  return {
    course_name: has('course_written'),
    date_played: has('date_played'),
    holes: has('holes'),
    score: has('score'),
    over_par: has('over_par'),
    rating: has('rating'),
    par: has('par'),
    course_rating: has('course_rating'),
    slope: has('slope'),
    notes: ''
  }
}

// Scores one read scorecard against what a person says is on it. The number that
// matters most is silentErrors: a hole read wrong that was NOT flagged as hard to
// read, because the golfer only double-checks the flagged ones.
function scoreScorecard (proposal, expected) {
  const checks = []
  const check = (field, got, want) => checks.push({ field, expected: want, got, pass: got === want })

  if ('course' in expected) check('course', courseOutcome(proposal), expected.course)
  for (const field of ['hole_count', 'par_total', 'tee', 'course_rating', 'slope', 'date_played']) {
    if (field in expected) check(field, proposal.card[field] ?? null, expected[field])
  }

  const player = proposal.players[expected.player ?? 0]
  if (!player && (expected.strokes || 'total' in expected)) {
    checks.push({ field: 'player', expected: 'a row', got: null, pass: false })
    return { checks, pass: false, cells: null, pars: null }
  }
  if (player && 'total' in expected) check('total', player.total, expected.total)

  const perHole = (expectedList, key) => {
    if (!expectedList) return
    const got = expectedList.filter((want, i) => proposal.card.holes[i]?.[key] === want).length
    checks.push({ field: key === 'distance' ? 'distances' : 'stroke_indexes', expected: expectedList.length, got, pass: got === expectedList.length })
  }
  perHole(expected.distances, 'distance')
  perHole(expected.stroke_indexes, 'stroke_index')

  let cells = null
  if (player && expected.strokes) {
    cells = { total: expected.strokes.length, correct: 0, silentErrors: 0, flaggedErrors: 0 }
    expected.strokes.forEach((want, i) => {
      const cell = player.scores[i]
      if (cell && cell.strokes === want) cells.correct += 1
      else if (cell && cell.legible === false) cells.flaggedErrors += 1
      else cells.silentErrors += 1
    })
  }

  let pars = null
  if (expected.pars) {
    pars = { total: expected.pars.length, correct: expected.pars.filter((want, i) => proposal.card.holes[i]?.par === want).length }
  }

  const pass = checks.every((c) => c.pass) && (!cells || cells.correct === cells.total) && (!pars || pars.correct === pars.total)
  return { checks, pass, cells, pars }
}

module.exports = { scoreCase, summarise, goldExtraction, scoreScorecard }
