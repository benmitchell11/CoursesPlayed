/**
 * Pulls website/phone/email/holes/opening_hours from OpenStreetMap golf_course
 * features and merges them into seeds/nz-courses.json + the local database.
 *
 * Usage: node server/db/enrichCoursesFromOsm.js
 */
const fs = require('fs/promises')
const path = require('path')

const connection = require('./connection')

const SEED_PATH = path.join(__dirname, 'seeds', 'nz-courses.json')
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
]

// Bounding box for mainland NZ + nearby islands (avoids flaky area lookups).
const QUERY = `
  [out:json][timeout:180];
  (
    node["leisure"="golf_course"](-47.5,166.0,-34.0,179.0);
    way["leisure"="golf_course"](-47.5,166.0,-34.0,179.0);
    relation["leisure"="golf_course"](-47.5,166.0,-34.0,179.0);
  );
  out center tags;
`

function normaliseName (name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function pickMeta (tags = {}) {
  return {
    website: tags.website || tags['contact:website'] || null,
    phone: tags.phone || tags['contact:phone'] || null,
    email: tags.email || tags['contact:email'] || null,
    holes: tags.holes || tags.golf_course || null,
    opening_hours: tags.opening_hours || null
  }
}

function hasAnyMeta (meta) {
  return Boolean(meta.website || meta.phone || meta.email || meta.holes || meta.opening_hours)
}

async function fetchOsmCourses () {
  let lastError

  for (const url of OVERPASS_URLS) {
    try {
      console.log(`Fetching OSM golf courses from ${url}…`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CoursesPlayed enricher'
        },
        body: new URLSearchParams({ data: QUERY })
      })

      if (!response.ok) {
        lastError = new Error(`${url} failed with ${response.status}`)
        continue
      }

      const data = await response.json()
      if (data.remark) console.warn(`Overpass remark: ${data.remark}`)

      const byName = new Map()
      let named = 0

      for (const element of data.elements || []) {
        const name = element.tags?.name?.trim()
        if (!name) continue
        named += 1
        const meta = pickMeta(element.tags)
        if (!hasAnyMeta(meta)) continue
        const key = normaliseName(name)
        if (!byName.has(key)) byName.set(key, { name, ...meta })
      }

      console.log(`OSM elements: ${(data.elements || []).length}, named: ${named}`)
      return byName
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

function mergeMeta (target, meta) {
  return {
    ...target,
    website: meta.website || target.website || null,
    phone: meta.phone || target.phone || null,
    email: meta.email || target.email || null,
    holes: meta.holes || target.holes || null,
    opening_hours: meta.opening_hours || target.opening_hours || null
  }
}

async function main () {
  const osmByName = await fetchOsmCourses()
  console.log(`OSM courses with contact/meta tags: ${osmByName.size}`)

  const seed = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'))
  let seedUpdated = 0
  const nextSeed = seed.map((course) => {
    const meta = osmByName.get(normaliseName(course.name))
    if (!meta) return course
    seedUpdated += 1
    return mergeMeta(course, meta)
  })
  await fs.writeFile(SEED_PATH, `${JSON.stringify(nextSeed, null, 2)}\n`)
  console.log(`Updated seed rows: ${seedUpdated}`)

  const dbCourses = await connection('courses').select('id', 'name', 'website', 'phone', 'email', 'holes', 'opening_hours')
  let dbUpdated = 0

  for (const course of dbCourses) {
    const meta = osmByName.get(normaliseName(course.name))
    if (!meta) continue

    const patch = {
      website: meta.website || course.website || null,
      phone: meta.phone || course.phone || null,
      email: meta.email || course.email || null,
      holes: meta.holes || course.holes || null,
      opening_hours: meta.opening_hours || course.opening_hours || null
    }

    const changed = Object.keys(patch).some((key) => patch[key] !== course[key])
    if (!changed) continue

    await connection('courses').where({ id: course.id }).update(patch)
    dbUpdated += 1
  }

  console.log(`Updated database rows: ${dbUpdated}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => connection.destroy())
