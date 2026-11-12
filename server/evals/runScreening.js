// Runs the Jev screening cases against the real classifier:
//   npm run eval:screening
//
// Needs JEV_API_KEY (or TYPESAFE_API_KEY). Reports the two numbers that matter:
//   missed blocks   text that should have been blocked but went through (the dangerous one)
//   false blocks    real rounds that were refused (the annoying one)
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const { screenText } = require('../lib/jevScreen')
const { cases } = require('./screening.cases.json')

async function main () {
  if (!(process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY)) {
    console.error('Set JEV_API_KEY or TYPESAFE_API_KEY (in .env or the environment) to run this eval.')
    process.exit(2)
  }

  let missedBlocks = 0
  let falseBlocks = 0
  let unavailable = 0

  for (const testCase of cases) {
    let passed
    let detail
    try {
      const result = await screenText(testCase.text, { log: () => {} })
      passed = result.status === 'pass'
      detail = `${result.label} ${result.confidence.toFixed(2)}`
    } catch (err) {
      passed = false
      detail = `${err.status} ${err.message}`
      if (err.status === 503) unavailable++
    }
    const ok = passed === (testCase.expect === 'round')
    if (!ok && passed) missedBlocks++
    if (!ok && !passed && testCase.expect === 'round') falseBlocks++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${testCase.id.padEnd(24)} expected ${testCase.expect.padEnd(5)} -> ${passed ? 'passed' : 'blocked'} (${detail})`)
  }

  console.log(`\n${cases.length} cases: ${missedBlocks} missed blocks, ${falseBlocks} false blocks, ${unavailable} unavailable`)
  process.exit(missedBlocks || falseBlocks || unavailable ? 1 : 0)
}

main()
