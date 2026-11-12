// In-memory limiter: at most `max` calls per `windowMs` for each key. Every parse
// is a paid model call, so this caps what one user can spend.
function createLimiter ({ max, windowMs = 60 * 1000 }) {
  const recent = new Map()
  return function allow (key, now = Date.now()) {
    const hits = (recent.get(key) || []).filter((t) => now - t < windowMs)
    if (hits.length >= max) {
      recent.set(key, hits)
      return false
    }
    hits.push(now)
    recent.set(key, hits)
    return true
  }
}

module.exports = { createLimiter }
