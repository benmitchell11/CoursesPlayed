// Runs the scorecard reader against real photos:
//   npm run eval:scorecards
//   npm run eval:scorecards -- --repeat 3 --model claude-opus-5
//
// Put photos in server/evals/scorecards/ as <name>.jpg (or .png / .webp) with a
// <name>.expected.json next to each. Photos and answers stay on your machine
// (both are git-ignored). Even two or three cards is a useful start.
//
// expected.json (every field optional, only the ones present are checked):
//   { "course": "Titirangi Golf Course", "player": 0, "hole_count": 18,
//     "pars": [4, 3, ...], "strokes": [5, 4, ...], "total": 86,
//     "tee": "White", "course_rating": 71.2, "slope": 128, "date_played": null }
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const { parseScorecard } = require('../lib/scorecardParser')
const { flush } = require('../lib/tracing')
const { pickProvider } = require('../lib/providers')
const { scoreScorecard } = require('./scoring')

const seed = require('../db/seeds/nz-courses.json')
const courses = seed.map((course, index) => ({ id: index + 1, name: course.name, city: course.city }))

const dir = path.join(__dirname, 'scorecards')
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

function argument (name, fallback) {
  const at = process.argv.indexOf(`--${name}`)
  return at === -1 ? fallback : process.argv[at + 1]
}

async function main () {
  if (!pickProvider()) {
    console.error('Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY (in .env or the environment) to run this eval.')
    process.exit(2)
  }

  const cards = fs.readdirSync(dir)
    .filter((file) => TYPES[path.extname(file).toLowerCase()])
    .map((file) => ({ file, expected: path.join(dir, `${path.basename(file, path.extname(file))}.expected.json`) }))
    .filter((card) => fs.existsSync(card.expected))

  if (!cards.length) {
    console.error(`No scorecards found. Add <name>.jpg and <name>.expected.json to ${dir}`)
    process.exit(2)
  }

  const repeat = Number(argument('repeat', 1))
  const model = argument('model', undefined)
  const runs = []

  for (let run = 1; run <= repeat; run++) {
    const totals = { cards: 0, passed: 0, cells: 0, correct: 0, silent: 0, flagged: 0 }
    console.log(`\nRun ${run}`)
    for (const card of cards) {
      const expected = JSON.parse(fs.readFileSync(card.expected, 'utf8'))
      const image = fs.readFileSync(path.join(dir, card.file)).toString('base64')
      const mediaType = TYPES[path.extname(card.file).toLowerCase()]
      try {
        const proposal = await parseScorecard({ image, mediaType, courses, allowNoPlayers: true, ...(model ? { model } : {}) })
        const result = scoreScorecard(proposal, expected)
        totals.cards += 1
        if (result.pass) totals.passed += 1
        if (result.cells) {
          totals.cells += result.cells.total
          totals.correct += result.cells.correct
          totals.silent += result.cells.silentErrors
          totals.flagged += result.cells.flaggedErrors
        }
        console.log(`  ${result.pass ? 'PASS' : 'FAIL'} ${card.file}` + (result.cells ? `  holes ${result.cells.correct}/${result.cells.total}, silent errors ${result.cells.silentErrors}, flagged errors ${result.cells.flaggedErrors}` : ''))
        for (const c of result.checks.filter((x) => !x.pass)) {
          console.log(`       ${c.field}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.got)}`)
        }
        if (result.pars) console.log(`       pars ${result.pars.correct}/${result.pars.total}`)
      } catch (err) {
        totals.cards += 1
        console.log(`  ERROR ${card.file}: ${err.message}`)
      }
    }
    console.log(`  ${totals.passed}/${totals.cards} cards fully correct; holes ${totals.correct}/${totals.cells}; silent errors ${totals.silent} (the ones that matter), flagged errors ${totals.flagged}`)
    runs.push({ run, totals })
  }

  const outDir = path.join(__dirname, 'results')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, `scorecards-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify({ model: model || 'default', runs }, null, 2))
  await flush()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
