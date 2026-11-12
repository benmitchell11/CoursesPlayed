// Works out a course's par from OpenStreetMap golf-hole data. Pure functions, no
// network: importCoursePar.js fetches the holes and calls these.
//
// OSM par is volunteer-mapped, so it is a good default and not an official
// figure. This code is deliberately strict about what it accepts: a course only
// gets a par when its holes 1..9 or 1..18 are all present exactly once with
// plausible values. Anything partial, duplicated or odd is skipped, not guessed.

const RADIUS_KM = 2

function haversineKm (lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

// Gives each hole to the nearest course within radiusKm. Returns Map(courseId -> holes[]).
function assignHoles (holes, courses, radiusKm = RADIUS_KM) {
  const assigned = new Map()
  for (const hole of holes) {
    const { lat, lon } = hole.center || {}
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    let best = null
    for (const course of courses) {
      if (Math.abs(course.lat - lat) > 0.05 || Math.abs(course.lng - lon) > 0.08) continue
      const km = haversineKm(lat, lon, course.lat, course.lng)
      if (km <= radiusKm && (!best || km < best.km)) best = { km, id: course.id }
    }
    if (!best) continue
    if (!assigned.has(best.id)) assigned.set(best.id, [])
    assigned.get(best.id).push(hole)
  }
  return assigned
}

// One course's holes -> { holes, hole_pars, par } or { skipped: reason }.
function deriveCoursePar (holes) {
  const byRef = new Map()
  for (const hole of holes) {
    const ref = Number(hole.tags?.ref)
    const par = Number(hole.tags?.par)
    if (!Number.isInteger(ref) || ref < 1) continue
    if (!Number.isInteger(par) || par < 3 || par > 6) {
      byRef.set(ref, new Set([...(byRef.get(ref) || []), NaN]))
      continue
    }
    byRef.set(ref, new Set([...(byRef.get(ref) || []), par]))
  }

  if (!byRef.size) return { skipped: 'no_usable_holes' }

  // What was found, so an anomaly can be checked against the club's own site.
  const refs = [...byRef.keys()].sort((a, b) => a - b)
  const seen = new Map()
  for (const hole of holes) {
    const ref = Number(hole.tags?.ref)
    if (Number.isInteger(ref)) seen.set(ref, (seen.get(ref) || 0) + 1)
  }
  const detail = {
    holes_found: holes.length,
    max_ref: refs[refs.length - 1],
    duplicate_refs: [...seen].filter(([, n]) => n > 1).map(([ref]) => ref),
    par_by_ref: Object.fromEntries(refs.map((ref) => [ref, [...byRef.get(ref)].map((p) => (Number.isNaN(p) ? 'invalid' : p))]))
  }

  if ([...byRef.values()].some((pars) => pars.size !== 1 || Number.isNaN([...pars][0]))) {
    return { skipped: 'conflicting_or_invalid_par', detail }
  }

  const count = refs.length
  const isRun = refs.every((ref, i) => ref === i + 1)
  if (!isRun || (count !== 9 && count !== 18)) {
    return { skipped: refs[refs.length - 1] > 18 ? 'more_than_18_holes' : 'incomplete', detail }
  }

  const holePars = refs.map((ref) => [...byRef.get(ref)][0])
  const par = holePars.reduce((a, b) => a + b, 0)
  const [min, max] = count === 18 ? [54, 76] : [27, 40]
  if (par < min || par > max) return { skipped: 'implausible_total' }

  return { holes: count, hole_pars: holePars, par }
}

// An unusual hole count means the OSM data itself is in doubt (a 27-hole site, several
// layouts mapped together, a stray extra hole). Those are never filled in from OSM:
// they are reported for checking against the club's own website instead.
const NEEDS_CHECK = new Set(['more_than_18_holes', 'conflicting_or_invalid_par'])

// All courses at once. Returns { pars: Map(courseId -> derived), skipped: Map(reason -> count),
// review: [{ courseId, reason, ...detail }] }.
function deriveAll (holes, courses, radiusKm = RADIUS_KM) {
  const assigned = assignHoles(holes, courses, radiusKm)
  const pars = new Map()
  const skipped = new Map()
  const review = []
  for (const [courseId, courseHoles] of assigned) {
    const result = deriveCoursePar(courseHoles)
    if (!result.skipped) {
      pars.set(courseId, result)
      continue
    }
    skipped.set(result.skipped, (skipped.get(result.skipped) || 0) + 1)
    if (NEEDS_CHECK.has(result.skipped)) review.push({ courseId, reason: result.skipped, ...result.detail })
  }
  return { pars, skipped, review, coursesWithHoles: assigned.size }
}

module.exports = { assignHoles, deriveCoursePar, deriveAll, haversineKm, RADIUS_KM }
