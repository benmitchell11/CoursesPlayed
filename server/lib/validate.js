// Small bounds checks shared by the text and scorecard parsers. Model output is
// untrusted input to the rest of the app, so it is checked here, in code.

function isRealDate (value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function inRange (value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max
}

// Returns { value, warning }: value is null when the date is unusable.
function checkDate (raw, today) {
  if (raw == null) return { value: null, warning: null }
  if (!isRealDate(raw)) return { value: null, warning: 'The date could not be read, so it has been left blank.' }
  if (raw > today) return { value: null, warning: 'That date is in the future, so it has been left blank.' }
  if (raw < `${Number(today.slice(0, 4)) - 5}${today.slice(4)}`) {
    return { value: null, warning: 'That date is more than five years ago, so it has been left blank.' }
  }
  return { value: raw, warning: null }
}

module.exports = { isRealDate, inRange, checkDate }
