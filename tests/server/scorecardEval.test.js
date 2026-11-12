const fs = require('fs')
const path = require('path')
const { scoreScorecard } = require('../../server/evals/scoring')
const { parseScorecard } = require('../../server/lib/scorecardParser')

const STROKES = [5, 4, 6, 5, 4, 3, 5, 6, 5, 5, 4, 4, 6, 5, 3, 5, 6, 5]
const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]

function proposal (strokes = STROKES, flagged = []) {
  return {
    card: {
      course_name: 'Titirangi', tee: 'White', hole_count: 18, par_total: 72, course_rating: null, slope: null, date_played: null,
      holes: PARS.map((par, i) => ({ hole: i + 1, par }))
    },
    course: { best: { name: 'Titirangi Golf Course' }, candidates: [{}] },
    players: [{ total: strokes.reduce((a, b) => a + b, 0), scores: strokes.map((s, i) => ({ hole: i + 1, strokes: s, legible: !flagged.includes(i + 1) })) }]
  }
}

const expected = { course: 'Titirangi Golf Course', hole_count: 18, pars: PARS, strokes: STROKES, total: 86, tee: 'White' }

describe('scoreScorecard', () => {
  test('passes a card that was read exactly', () => {
    const result = scoreScorecard(proposal(), expected)
    expect(result.pass).toBe(true)
    expect(result.cells).toEqual({ total: 18, correct: 18, silentErrors: 0, flaggedErrors: 0 })
    expect(result.pars).toEqual({ total: 18, correct: 18 })
  })

  test('counts a wrong hole that was flagged separately from one that was not', () => {
    const wrong = [...STROKES]
    wrong[3] = 9 // was 5
    wrong[10] = 1 // was 4

    const result = scoreScorecard(proposal(wrong, [4]), expected)

    expect(result.pass).toBe(false)
    expect(result.cells).toMatchObject({ correct: 16, flaggedErrors: 1, silentErrors: 1 })
  })

  test('fails when the total or course is wrong', () => {
    const result = scoreScorecard({ ...proposal(), course: { best: null, candidates: [] } }, { ...expected, total: 90 })
    expect(result.checks.filter((c) => !c.pass).map((c) => c.field)).toEqual(['course', 'total'])
  })

  test('only checks the fields the answer file lists', () => {
    const result = scoreScorecard(proposal(), { total: 86 })
    expect(result.checks).toHaveLength(1)
    expect(result.pass).toBe(true)
  })

  test('fails when the chosen player row is missing', () => {
    expect(scoreScorecard(proposal(), { player: 3, total: 86 }).pass).toBe(false)
  })
})

describe('scoreScorecard distances and stroke indexes', () => {
  const withHoles = (holes) => ({ ...proposal(), card: { ...proposal().card, holes } })

  test('counts each hole whose distance and stroke index match', () => {
    const holes = PARS.map((par, i) => ({ hole: i + 1, par, distance: 300 + i, stroke_index: i + 1 }))
    const expectedAll = { distances: holes.map((h) => h.distance), stroke_indexes: holes.map((h) => h.stroke_index) }
    expect(scoreScorecard(withHoles(holes), expectedAll).pass).toBe(true)

    const wrong = holes.map((h, i) => (i === 2 ? { ...h, distance: 999 } : h))
    const result = scoreScorecard(withHoles(wrong), expectedAll)
    expect(result.pass).toBe(false)
    expect(result.checks.find((c) => c.field === 'distances')).toMatchObject({ expected: 18, got: 17 })
  })

  test('a blank card needs no player row unless the answer asks for scores', () => {
    const blank = { ...proposal(), players: [] }
    expect(scoreScorecard(blank, { par_total: 72 }).pass).toBe(true)
    expect(scoreScorecard(blank, { total: 86 }).pass).toBe(false)
  })
})

// The real cards you photographed live in server/evals/scorecards (local only, git-ignored).
// This runs each card's answer file through the whole pipeline with a perfect stand-in
// model, so it tests the checking and matching code on real card data without any API.
const fixtureDir = path.join(__dirname, '..', '..', 'server', 'evals', 'scorecards')
const fixtures = fs.existsSync(fixtureDir)
  ? fs.readdirSync(fixtureDir).filter((f) => f.endsWith('.expected.json'))
  : []

describe.skipIf(!fixtures.length)('real scorecard fixtures, read by a perfect model', () => {
  const seed = require('../../server/db/seeds/nz-courses.json')
  const catalogue = seed.map((course, index) => ({ id: index + 1, name: course.name, city: course.city }))

  test.each(fixtures)('%s', async (file) => {
    const expected = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'))
    const gold = {
      course_name: expected.course_written ?? null,
      date_played: expected.date_played ?? null,
      tee: expected.tee ?? null,
      course_rating: expected.course_rating ?? null,
      slope: expected.slope ?? null,
      holes: expected.pars.map((par, i) => ({
        hole: i + 1, par, distance: expected.distances?.[i] ?? null, stroke_index: expected.stroke_indexes?.[i] ?? null
      })),
      // Filled cards carry the player's real scores and any totals written on the card.
      players: expected.strokes
        ? [{
            name: 'Player',
            scores: expected.strokes.map((strokes, i) => ({ hole: i + 1, strokes, legible: true })),
            printed_out: expected.written_totals?.out ?? null,
            printed_in: expected.written_totals?.in ?? null,
            printed_total: expected.written_totals?.total ?? null
          }]
        : []
    }
    // "Today" must not be before the round, or the date is rightly rejected as in the future.
    const today = expected.date_played && expected.date_played > '2026-09-25' ? expected.date_played : '2026-09-25'
    const client = { messages: { parse: async () => ({ parsed_output: gold, usage: { input_tokens: 1, output_tokens: 1 } }) } }
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]).toString('base64')

    const result = await parseScorecard({ image: jpeg, mediaType: 'image/jpeg', courses: catalogue, client, today, allowNoPlayers: true })
    const scored = scoreScorecard(result, expected)
    const holeCount = expected.pars.length

    expect(scored.checks.filter((c) => !c.pass)).toEqual([])
    expect(scored.pars).toEqual({ total: holeCount, correct: holeCount })
    if (expected.strokes) expect(scored.cells).toMatchObject({ total: holeCount, correct: holeCount, silentErrors: 0 })

    // Totals deliberately written wrong on the card must raise a warning; otherwise there are none.
    const w = expected.written_totals
    const added = expected.strokes && expected.strokes.reduce((a, b) => a + b, 0)
    if (w && w.total != null && w.total !== added) {
      expect(result.warnings.join(' ')).toMatch(/Total/)
    } else {
      expect(result.warnings).toEqual([])
    }
  })
})

