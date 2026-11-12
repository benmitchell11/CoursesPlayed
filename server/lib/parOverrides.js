// Pars that a person has checked against the club's own website. They win over
// OpenStreetMap, and each one must say where it was checked and when, so a par is
// never accepted on trust. A malformed entry throws: better a failed import than a
// silently wrong par.

const REQUIRED = ['name', 'holes', 'hole_pars', 'source_url', 'checked']

function validateOverride (entry) {
  const problems = []
  for (const key of REQUIRED) {
    if (entry[key] == null || entry[key] === '') problems.push(`missing ${key}`)
  }
  if (problems.length) return problems

  if (entry.holes !== 9 && entry.holes !== 18) problems.push('holes must be 9 or 18')
  if (!Array.isArray(entry.hole_pars) || entry.hole_pars.length !== entry.holes) {
    problems.push('hole_pars must list one par per hole')
  } else if (!entry.hole_pars.every((p) => Number.isInteger(p) && p >= 3 && p <= 6)) {
    problems.push('every hole par must be a whole number from 3 to 6')
  } else if (entry.par != null && entry.par !== entry.hole_pars.reduce((a, b) => a + b, 0)) {
    problems.push('par does not equal the sum of hole_pars')
  }
  if (!/^https?:\/\//.test(String(entry.source_url))) problems.push('source_url must be a web address')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entry.checked))) problems.push('checked must be a date (YYYY-MM-DD)')
  return problems
}

// Returns the overrides ready to apply, keyed by lower-cased course name.
function loadOverrides (entries) {
  const byName = new Map()
  for (const entry of entries) {
    const problems = validateOverride(entry)
    if (problems.length) throw new Error(`Bad par override for "${entry.name || '(no name)'}": ${problems.join('; ')}`)
    const key = entry.name.toLowerCase()
    if (byName.has(key)) throw new Error(`Duplicate par override for "${entry.name}"`)
    byName.set(key, {
      holes: entry.holes,
      hole_pars: entry.hole_pars,
      par: entry.hole_pars.reduce((a, b) => a + b, 0),
      par_source: entry.par_source || 'club_checked',
      source_url: entry.source_url,
      checked: entry.checked,
      note: entry.note || null
    })
  }
  return byName
}

module.exports = { validateOverride, loadOverrides }
