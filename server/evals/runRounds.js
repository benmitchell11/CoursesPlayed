// Runs the round-parsing eval set against the real model:
//   npm run eval:rounds            one run
//   npm run eval:rounds -- --repeat 3 --model claude-sonnet-4-5
//
// Scores vary between runs, so repeat before trusting a small change. Needs
// OPENROUTER_API_KEY or ANTHROPIC_API_KEY. With LANGFUSE_* set, every call is traced as well.
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const { parseRound } = require('../lib/roundParser')
const { flush } = require('../lib/tracing')
const { pickProvider } = require('../lib/providers')
const { scoreCase, summarise } = require('./scoring')

const { today, cases } = require('./rounds.cases.json')
const seed = require('../db/seeds/nz-courses.json')
const courses = seed.map((course, index) => ({ id: index + 1, name: course.name, city: course.city }))

function argument (name, fallback) {
  const at = process.argv.indexOf(`--${name}`)
  return at === -1 ? fallback : process.argv[at + 1]
}

async function main () {
  if (!pickProvider()) {
    console.error('Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY (in .env or the environment) to run this eval.')
    process.exit(2)
  }

  const repeat = Number(argument('repeat', 1))
  const model = argument('model', undefined)
  const runs = []

  for (let run = 1; run <= repeat; run++) {
    const results = []
    for (const testCase of cases) {
      let outcome
      try {
        const proposal = await parseRound({ text: testCase.text, courses, today, ...(model ? { model } : {}) })
        outcome = { id: testCase.id, text: testCase.text, ...scoreCase(proposal, testCase.expect), warnings: proposal.warnings }
      } catch (err) {
        // For an injection case, the screen refusing it is a correct outcome: the model never saw it.
        if (testCase.id.startsWith('inject-') && err.status === 422) {
          results.push({ id: testCase.id, text: testCase.text, pass: true, checks: [], blockedByScreen: true })
          continue
        }
        outcome = { id: testCase.id, text: testCase.text, pass: false, checks: [], error: err.message }
      }
      results.push(outcome)
    }

    const summary = summarise(results)
    runs.push({ run, summary, results })

    console.log(`\nRun ${run}: ${summary.passed}/${summary.cases} cases fully correct`)
    for (const [field, { pass, total }] of Object.entries(summary.byField)) {
      console.log(`  ${field.padEnd(14)} ${pass}/${total}`)
    }
    for (const result of results.filter((r) => !r.pass)) {
      console.log(`  FAIL ${result.id}: "${result.text}"`)
      if (result.error) console.log(`       error: ${result.error}`)
      for (const check of result.checks.filter((c) => !c.pass)) {
        console.log(`       ${check.field}: expected ${JSON.stringify(check.expected)}, got ${JSON.stringify(check.got)}`)
      }
    }
  }

  const outDir = path.join(__dirname, 'results')
  fs.mkdirSync(outDir, { recursive: true })
  const file = path.join(outDir, `rounds-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify({ model: model || 'default', today, runs }, null, 2))
  console.log(`\nSaved ${file}`)

  await flush()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
