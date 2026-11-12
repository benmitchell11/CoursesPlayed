const connection = require('../db/connection')
const { normalise } = require('../lib/courseMatch')

module.exports = {
  searchCourses,
  createCourse,
  getCourseById
}

// hole_pars is stored as a JSON string; callers get an array (or null).
function present (row) {
  if (!row) return row
  let holePars = null
  try {
    holePars = row.hole_pars ? JSON.parse(row.hole_pars) : null
  } catch {
    holePars = null
  }
  return { ...row, hole_pars: Array.isArray(holePars) ? holePars : null }
}

// SQLite compares raw character codes, so it puts "Ōtaki" after "Zealandia" and a
// lower-case "prodrive" after every capital letter, and its LIKE does not treat "ā" as
// "a". Sorting and searching are done here instead, with a real collator and with
// macrons and other accents ignored, so "otaki" finds "Ōtaki" and "Ōtaki" finds "Otaki".
const collator = new Intl.Collator('en-NZ')

async function searchCourses ({ search, country } = {}, db = connection) {
  let query = db('courses').select()
  if (country) query = query.andWhere({ country })

  let rows = (await query).map(present)

  const needle = normalise(search)
  if (needle) {
    rows = rows.filter((row) => normalise(row.name).includes(needle) || normalise(row.city).includes(needle))
  }

  return rows.sort((a, b) => collator.compare(a.name, b.name) || a.id - b.id)
}

function createCourse ({ name, city, country, lat, lng, createdBy }, db = connection) {
  return db('courses')
    .insert({ name, city, country, lat, lng, created_by: createdBy })
    .then(([id]) => getCourseById(id, db))
}

function getCourseById (id, db = connection) {
  return db('courses').select().where({ id }).first().then(present)
}
