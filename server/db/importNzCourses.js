const fs = require('fs/promises')
const path = require('path')

const OUTPUT_PATH = path.join(__dirname, 'seeds', 'nz-courses.json')
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter'
const QUERY = `
  [out:json][timeout:180];
  (
    node["leisure"="golf_course"](-47.5,166.0,-34.0,179.0);
    way["leisure"="golf_course"](-47.5,166.0,-34.0,179.0);
    relation["leisure"="golf_course"](-47.5,166.0,-34.0,179.0);
  );
  out center tags;
`

function normaliseCourse (element) {
  const { tags = {} } = element
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  const name = tags.name?.trim()

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const city = tags['addr:city'] ||
    tags['addr:town'] ||
    tags['addr:village'] ||
    tags['addr:suburb'] ||
    tags['addr:locality'] ||
    tags['addr:region'] ||
    'New Zealand'

  return {
    name,
    city,
    country: 'New Zealand',
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    website: tags.website || tags['contact:website'] || null,
    phone: tags.phone || tags['contact:phone'] || null,
    email: tags.email || tags['contact:email'] || null,
    holes: tags.holes || tags.golf_course || null,
    opening_hours: tags.opening_hours || null
  }
}

async function main () {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'CoursesPlayed development importer'
    },
    body: new URLSearchParams({ data: QUERY })
  })

  if (!response.ok) {
    throw new Error(`OpenStreetMap request failed with ${response.status}`)
  }

  const data = await response.json()
  const byName = new Map()

  for (const element of data.elements) {
    const course = normaliseCourse(element)
    if (course && !byName.has(course.name.toLowerCase())) {
      byName.set(course.name.toLowerCase(), course)
    }
  }

  const courses = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(courses, null, 2)}\n`)
  console.log(`Saved ${courses.length} New Zealand golf courses to ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
