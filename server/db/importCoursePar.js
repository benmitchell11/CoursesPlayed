/**
 * Fills in each course's par from OpenStreetMap golf-hole data and merges it into
 * seeds/nz-courses.json and the local database.
 *
 * Usage:
 *   npm run migrate                              (adds the par columns, once)
 *   node server/db/importCoursePar.js --dry-run  (report only, writes nothing)
 *   node server/db/importCoursePar.js
 *
 * OSM par is volunteer-mapped: it is stored with par_source = 'osm' and treated
 * as approximate. A course only gets a par when all of its holes 1..9 or 1..18
 * are found once each (see server/lib/parFromOsm.js). A par that already has a
 * source (a scorecard, or one entered by hand) is never overwritten.
 */
const fs = require('fs/promises')
const path = require('path')

const connection = require('./connection')
const { deriveAll } = require('../lib/parFromOsm')
const { areTwins } = require('../lib/courseTwins')
const { loadOverrides } = require('../lib/parOverrides')

const SEED_PATH = path.join(__dirname, 'seeds', 'nz-courses.json')
const OVERRIDES_PATH = path.join(__dirname, 'seeds', 'par-overrides.json')
const REVIEW_PATH = path.join(__dirname, 'par-review.json')

// A par with one of these sources may be replaced by a checked override. Anything
// else (a scorecard, one typed in by hand) is left alone.
const overwritable = (source) => !source || ['osm', 'osm_checked', 'club', 'club_checked'].includes(source)
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
]

const QUERY = `
  [out:json][timeout:180];
  way["golf"="hole"]["par"](-47.5,166.0,-34.0,179.0);
  out tags center;
`

async function fetchHoles () {
  let lastError
  for (const url of OVERPASS_URLS) {
    try {
      console.log(`Fetching OSM golf holes from ${url}…`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CoursesPlayed par importer'
        },
        body: new URLSearchParams({ data: QUERY })
      })
      if (!response.ok) {
        lastError = new Error(`${url} failed with ${response.status}`)
        continue
      }
      const data = await response.json()
      if (data.remark) console.warn(`Overpass remark: ${data.remark}`)
      console.log(`OSM holes with a par tag: ${(data.elements || []).length}`)
      return data.elements || []
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function main () {
  const dryRun = process.argv.includes('--dry-run')

  const hasColumn = await connection.schema.hasColumn('courses', 'par')
  if (!hasColumn) throw new Error('The courses table has no par column yet. Run: npm run migrate')

  const holes = await fetchHoles()
  const dbCourses = await connection('courses').select('id', 'name', 'lat', 'lng', 'holes', 'par', 'par_source')
  const { pars, skipped, review, coursesWithHoles } = deriveAll(holes, dbCourses)

  const count = (n) => [...pars.values()].filter((p) => p.holes === n).length
  console.log(`\nCourses in database: ${dbCourses.length}`)
  console.log(`Courses with OSM holes nearby: ${coursesWithHoles}`)
  for (const [reason, n] of skipped) console.log(`  skipped, ${reason}: ${n}`)

  // Copy each derived par onto a duplicate listing of the same course that has none.
  let twinCopies = 0
  for (const course of dbCourses) {
    if (pars.has(course.id) || course.par_source) continue
    const twin = dbCourses.find((other) => pars.has(other.id) && areTwins(course, other))
    if (!twin) continue
    pars.set(course.id, pars.get(twin.id))
    twinCopies += 1
  }
  if (twinCopies) console.log(`Par copied onto duplicate listings of the same course: ${twinCopies}`)

  // Pars a person has checked against the club's own website win over OSM.
  const overrides = loadOverrides(JSON.parse(await fs.readFile(OVERRIDES_PATH, 'utf8')))
  const overridden = new Set()
  for (const course of dbCourses) {
    const override = overrides.get(course.name.toLowerCase())
    if (!override) continue
    pars.set(course.id, override)
    overridden.add(course.id)
  }
  const unmatched = [...overrides.keys()].filter((name) => !dbCourses.some((c) => c.name.toLowerCase() === name))
  if (unmatched.length) throw new Error(`Par overrides for courses not in the database: ${unmatched.join(', ')}`)
  if (overridden.size) console.log(`Checked overrides applied: ${overridden.size}`)

  // Unusual hole counts are never filled from OSM. They are written out to be checked
  // against the club's own website, and recorded in par-overrides.json once they have been.
  const websiteOf = new Map((await connection('courses').select('id', 'website')).map((r) => [r.id, r.website]))
  const needsCheck = review
    .filter((entry) => !overridden.has(entry.courseId))
    .map((entry) => {
      const course = dbCourses.find((c) => c.id === entry.courseId)
      return { name: course.name, id: course.id, website: websiteOf.get(course.id) || null, ...entry, courseId: undefined }
    })
  console.log(`
Needs checking against the club's website (not filled in): ${needsCheck.length}`)
  for (const entry of needsCheck) {
    console.log(`  ${entry.name} - ${entry.reason}, ${entry.holes_found} holes found, highest number ${entry.max_ref}${entry.website ? `, ${entry.website}` : ', no website in the catalogue'}`)
  }
  if (!dryRun) await fs.writeFile(REVIEW_PATH, `${JSON.stringify(needsCheck, null, 2)}
`)

  console.log(`Par derived: ${pars.size} (${count(18)} eighteen-hole, ${count(9)} nine-hole), including those copies`)
  const alreadySourced = dbCourses.filter((c) => pars.has(c.id) && c.par_source).length
  console.log(`Already have a sourced par (left alone): ${alreadySourced}`)

  if (dryRun) {
    console.log('\nDry run: nothing written. Sample:')
    for (const course of dbCourses.filter((c) => pars.has(c.id)).slice(0, 10)) {
      console.log(`  ${course.name}: par ${pars.get(course.id).par} (${pars.get(course.id).holes} holes)`)
    }
    return
  }

  let dbUpdated = 0
  for (const course of dbCourses) {
    const derived = pars.get(course.id)
    if (!derived) continue
    if (course.par_source && !(overridden.has(course.id) && overwritable(course.par_source))) continue
    await connection('courses').where({ id: course.id }).update({
      par: derived.par,
      hole_pars: JSON.stringify(derived.hole_pars),
      par_source: derived.par_source || 'osm',
      holes: overridden.has(course.id) ? String(derived.holes) : course.holes || String(derived.holes)
    })
    dbUpdated += 1
  }
  console.log(`\nUpdated database rows: ${dbUpdated}`)

  const byName = new Map(dbCourses.map((c) => [c.name.toLowerCase(), c]))
  const seed = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'))
  let seedUpdated = 0
  const nextSeed = seed.map((entry) => {
    const course = byName.get(entry.name.toLowerCase())
    const derived = course && pars.get(course.id)
    if (!derived) return entry
    if (entry.par_source && !(overridden.has(course.id) && overwritable(entry.par_source))) return entry
    seedUpdated += 1
    return { ...entry, holes: String(derived.holes), par: derived.par, hole_pars: derived.hole_pars, par_source: derived.par_source || 'osm' }
  })
  await fs.writeFile(SEED_PATH, `${JSON.stringify(nextSeed, null, 2)}\n`)
  console.log(`Updated seed rows: ${seedUpdated}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => connection.destroy())
