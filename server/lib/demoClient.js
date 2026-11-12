// Demo mode: stands in for the language model so the whole flow can be shown with no
// key. It is switched on only by DEMO_MODE=true and only when no real provider is
// configured, so a real key always wins. Everything it returns goes through the same
// validation, course matching and confirm screen as a real answer, and the response is
// marked demo: true so the app says so on screen.
//
// Text: a few plain rules (score, date, holes, course words). It is not intelligent;
// it exists so a demo doesn't depend on a key or the network.
// Photo: it does not read the image. It always returns the same sample card.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const FILLER = new Set([
  'i', 'played', 'play', 'at', 'on', 'the', 'a', 'had', 'got', 'shot', 'scored', 'score', 'today', 'yesterday',
  'last', 'this', 'morning', 'afternoon', 'round', 'of', 'golf', 'with', 'for', 'in', 'my', 'and', 'off', 'holes',
  'front', 'back', 'nine', 'over', 'par', 'was', 'it', 'windy', 'rain', 'sunny', 'wet', 'cold', 'hot', ...WEEKDAYS
])

const iso = (date) => date.toISOString().slice(0, 10)
const daysAgo = (today, n) => {
  const d = new Date(`${today}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return iso(d)
}

function findDate (text, today) {
  const lower = text.toLowerCase()
  const explicit = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text)
  if (explicit) return explicit[0]
  const nz = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/.exec(text) // day/month/year, as written in NZ
  if (nz) {
    const year = nz[3].length === 2 ? `20${nz[3]}` : nz[3]
    return `${year}-${nz[2].padStart(2, '0')}-${nz[1].padStart(2, '0')}`
  }
  if (/\byesterday\b/.test(lower)) return daysAgo(today, 1)
  if (/\btoday\b/.test(lower)) return today
  const weekday = /\blast (sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/.exec(lower)
  if (weekday) {
    const todayIndex = new Date(`${today}T12:00:00Z`).getUTCDay()
    const back = ((todayIndex - WEEKDAYS.indexOf(weekday[1]) + 6) % 7) + 1
    return daysAgo(today, back)
  }
  return null
}

function readText (text, today) {
  const withoutDates = text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ').replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, ' ')
  const relative = /([+-]\d{1,2})\b/.exec(withoutDates) || /\b(\d{1,2}) over\b/i.exec(withoutDates)
  const overPar = relative ? Number(relative[1]) : null

  let score = null
  if (overPar == null) {
    const numbers = [...withoutDates.matchAll(/\b(\d{2,3})\b/g)].map((m) => Number(m[1])).filter((n) => n >= 40 && n <= 200)
    score = numbers.length ? numbers[0] : null
  }

  const holes = /\b(front|back) nine\b|\b9 holes\b/i.test(text) ? 9 : /\b18 holes\b/i.test(text) ? 18 : null

  // Course words: everything before the first number or "shot/scored", minus filler.
  const beforeScore = withoutDates.split(/\b(?:shot|scored|got|had|[+-]?\d)/i)[0]
  const words = beforeScore.split(/[\s,.+-]+/).filter((w) => w && !FILLER.has(w.toLowerCase()))
  const courseName = words.length ? words.join(' ') : null

  return {
    course_name: courseName,
    date_played: findDate(text, today),
    holes,
    score,
    over_par: overPar,
    rating: null,
    par: null,
    course_rating: null,
    slope: null,
    notes: ''
  }
}

// One sample card: a par-72 course, one player, one hole the "reader" was unsure of, and
// no date, so the demo shows the highlighted hole and the required-date step.
function sampleCard () {
  const pars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5]
  const strokes = [5, 4, 3, 6, 5, 4, 4, 5, 5, 4, 5, 3, 6, 4, 5, 3, 4, 6]
  return {
    course_name: 'Titirangi Golf Club',
    date_played: null,
    tee: 'White',
    course_rating: 71.2,
    slope: 125,
    holes: pars.map((par, i) => ({ hole: i + 1, par, distance: null, stroke_index: null })),
    players: [{
      name: 'Demo Player',
      scores: strokes.map((s, i) => ({ hole: i + 1, strokes: s, legible: i !== 6 })),
      printed_out: null,
      printed_in: null,
      printed_total: null
    }]
  }
}

function createDemoClient () {
  return {
    messages: {
      async parse (request) {
        const today = /Today is (\d{4}-\d{2}-\d{2})/.exec(request.system || '')?.[1] || iso(new Date())
        const content = request.messages[0].content
        const isPhoto = Array.isArray(content)
        const text = isPhoto ? '' : content.replace(/<\/?round_description>/g, '').trim()
        return { parsed_output: isPhoto ? sampleCard() : readText(text, today), usage: { input_tokens: 0, output_tokens: 0 } }
      }
    }
  }
}

module.exports = { createDemoClient, readText, sampleCard }
