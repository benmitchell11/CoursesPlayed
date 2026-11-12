// Runs every eval case through a *perfect* stand-in model against the real course
// catalogue. It calls no API: it checks that, given the extraction a good model
// would produce, the matching and validation code gets each case right. If one of
// these fails, the bug is in our code, not in the model.
const { parseRound } = require('../../server/lib/roundParser')
const { scoreCase, summarise, goldExtraction } = require('../../server/evals/scoring')
const { today, cases } = require('../../server/evals/rounds.cases.json')
const seed = require('../../server/db/seeds/nz-courses.json')

const courses = seed.map((course, index) => ({ id: index + 1, name: course.name, city: course.city }))

function perfectClient (expect) {
  return { messages: { parse: async () => ({ parsed_output: goldExtraction(expect), usage: { input_tokens: 1, output_tokens: 1 } }) } }
}

describe('round eval cases with a perfect model', () => {
  test.each(cases.map((c) => [c.id, c]))('%s', async (_id, testCase) => {
    const proposal = await parseRound({ text: testCase.text, courses, client: perfectClient(testCase.expect), today })
    const result = scoreCase(proposal, testCase.expect)
    expect(result.checks.filter((check) => !check.pass)).toEqual([])
  })

  test('covers ambiguity, missing course, injection and validation cases', () => {
    const ids = cases.map((c) => c.id)
    expect(ids).toEqual(expect.arrayContaining(['ambiguous-wairakei', 'not-in-catalogue', 'inject-admin', 'future-date', 'impossible-score']))
    expect(cases.length).toBeGreaterThanOrEqual(25)
  })

  test('summarise reports per-field accuracy', async () => {
    const results = []
    for (const testCase of cases) {
      const proposal = await parseRound({ text: testCase.text, courses, client: perfectClient(testCase.expect), today })
      results.push(scoreCase(proposal, testCase.expect))
    }
    const summary = summarise(results)
    expect(summary.cases).toBe(cases.length)
    expect(summary.passed).toBe(cases.length)
    expect(summary.byField.course.total).toBeGreaterThan(20)
  })
})
