// Matches the course name a golfer typed against the course catalogue.
// Deliberately deterministic: the model extracts what was written, this code
// decides which catalogue row (if any) that is, so a model can never produce
// a course id that does not exist.

const STOPWORDS = new Set([
  'golf', 'club', 'course', 'courses', 'links', 'country', 'the', 'and', 'of',
  'resort', 'gc', 'cc', 'at', 'inc'
])

function normalise (value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens (value) {
  return normalise(value).split(' ').filter((t) => t && !STOPWORDS.has(t))
}

function levenshtein (a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

function tokenSimilarity (a, b) {
  const longest = Math.max(a.length, b.length)
  if (!longest) return 0
  const sim = 1 - levenshtein(a, b) / longest
  return sim >= 0.7 ? sim : 0
}

// How well the query's tokens are covered by the course's name (0..1), with a small
// penalty when the name has many extra distinct tokens so "Paraparaumu" beats
// "Paraparaumu Beach Kapiti Coast" for an exact query. A word that is not in the name
// but is the course's city ("RNZAF Auckland" for "RNZAF Golf Club", Auckland) is
// credited a little less, and only once at least one word matched the name itself,
// so a city on its own can never pick a course.
function scoreCourse (queryTokens, course) {
  const nameTokens = tokens(course.name)
  if (!queryTokens.length || !nameTokens.length) return 0
  const cityTokens = tokens(course.city)

  let covered = 0
  let matchedName = false
  const unmatched = []
  for (const q of queryTokens) {
    let best = 0
    for (const n of nameTokens) best = Math.max(best, tokenSimilarity(q, n))
    if (best > 0) matchedName = true
    covered += best
    if (best === 0) unmatched.push(q)
  }

  if (matchedName) {
    for (const q of unmatched) {
      const inCity = cityTokens.some((c) => tokenSimilarity(q, c) >= 0.85)
      if (inCity) covered += 0.9
    }
  }

  const coverage = covered / queryTokens.length
  const extra = Math.max(0, nameTokens.length - queryTokens.length)
  return Math.max(0, coverage - extra * 0.04)
}

const CONFIDENT_SCORE = 0.85
const CONFIDENT_MARGIN = 0.1

// The same course listed twice under different names is one candidate, and the
// copy that has a par (then the lower id) is the one offered.
function collapseTwins (scored) {
  const { areTwins } = require('./courseTwins')
  const kept = []
  for (const entry of scored) {
    const twinAt = kept.findIndex((other) => areTwins(other.course, entry.course))
    if (twinAt === -1) {
      kept.push(entry)
      continue
    }
    const current = kept[twinAt].course
    const better = (entry.course.par != null && current.par == null) ||
      ((entry.course.par != null) === (current.par != null) && entry.course.id < current.id)
    if (better) kept[twinAt] = entry
  }
  return kept
}

function matchCourse (text, courses, { limit = 5 } = {}) {
  const queryTokens = tokens(text)
  if (!queryTokens.length) return { best: null, confident: false, candidates: [] }

  const scored = collapseTwins(
    courses
      .map((course) => ({ course, score: scoreCourse(queryTokens, course) }))
      .filter((entry) => entry.score >= 0.5)
      .sort((a, b) => b.score - a.score || a.course.name.localeCompare(b.course.name))
  )

  const candidates = scored.slice(0, limit).map(({ course, score }) => ({
    id: course.id,
    name: course.name,
    city: course.city,
    // par comes from the catalogue (approximate, see par_source), never from the model
    par: course.par ?? null,
    holes: course.holes ?? null,
    hole_pars: course.hole_pars ?? null,
    par_source: course.par_source ?? null,
    score: Math.round(score * 100) / 100
  }))

  const [first, second] = scored
  const confident = Boolean(
    first &&
      first.score >= CONFIDENT_SCORE &&
      (!second || first.score - second.score >= CONFIDENT_MARGIN)
  )

  return { best: confident ? candidates[0] : null, confident, candidates }
}

module.exports = { matchCourse, normalise, tokens }
