// Par for the number of holes actually played, from the course catalogue.
// Catalogue par is approximate (mostly volunteer-mapped OpenStreetMap data, see
// par_source), so the result says how it was worked out and callers show it as
// something to check, never as fact.

function sum (values) {
  return values.reduce((a, b) => a + b, 0)
}

// Returns { par, basis } or null when the course has no par, or the catalogue
// cannot say what par is for that many holes.
export function parForHoles (course, holes) {
  if (!course || !Number.isFinite(course.par)) return null
  const played = Number(holes) || 18
  const holePars = Array.isArray(course.hole_pars) ? course.hole_pars : null
  const length = holePars ? holePars.length : Number(course.holes) || null

  if (length === played) return { par: course.par, basis: 'the course list' }
  if (holePars && length === 18 && played === 9) {
    return { par: sum(holePars.slice(0, 9)), basis: 'the front nine in the course list' }
  }
  if (length === 9 && played === 18) {
    return { par: course.par * 2, basis: 'two loops of the nine holes in the course list' }
  }
  return null
}
