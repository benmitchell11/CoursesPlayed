// The catalogue lists some courses twice under slightly different names
// ("Titirangi Golf Club" and "Titirangi Golf Course"). Rounds saved in Firestore
// point at these rows by numeric id, so the duplicates cannot simply be merged or
// deleted. Instead, rows whose names are identical once filler words are dropped,
// and that sit near each other, are treated as the same course.
const { tokens } = require('./courseMatch')
const { haversineKm } = require('./parFromOsm')

// Hand-added rows have rough (town-level) coordinates, so allow a generous gap.
const TWIN_KM = 25

function canonicalName (name) {
  return tokens(name).sort().join(' ')
}

function areTwins (a, b) {
  if (!a || !b || a.id === b.id) return false
  const key = canonicalName(a.name)
  if (!key || key !== canonicalName(b.name)) return false
  const hasCoords = [a.lat, a.lng, b.lat, b.lng].every(Number.isFinite)
  return !hasCoords || haversineKm(a.lat, a.lng, b.lat, b.lng) <= TWIN_KM
}

module.exports = { canonicalName, areTwins, TWIN_KM }
