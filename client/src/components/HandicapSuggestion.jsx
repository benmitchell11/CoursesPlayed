import React, { useMemo, useState } from 'react'

import { calculateHandicap } from '../lib/handicap'
import '../styles/HandicapSuggestion.css'

const SKIP_REASONS = {
  not_18_holes: 'not an 18-hole round',
  no_par_or_rating: 'no par, or course rating and slope, to compare the score to'
}

function formatIndex (value) {
  return Number(value).toFixed(1).replace(/\.0$/, '')
}

// Suggests a handicap from logged rounds. It only ever suggests: the number is
// written to the profile when the golfer presses the button, never before.
function HandicapSuggestion ({ rounds, currentHandicap, onApply }) {
  const result = useMemo(() => calculateHandicap(rounds), [rounds])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleApply = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await onApply(result.index)
      setMessage(`Handicap set to ${formatIndex(result.index)}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const alreadySet = result.index != null && Number(currentHandicap) === result.index

  return (
    <section className="handicap-suggestion" aria-labelledby="handicap-suggestion-heading">
      <h2 id="handicap-suggestion-heading">Suggested handicap</h2>

      {result.index == null
        ? (
          <p className="handicap-suggestion-note">
            Log {result.roundsNeeded || 3} more 18-hole round{(result.roundsNeeded || 3) === 1 ? '' : 's'} with a score
            and a par (or course rating and slope) to get a suggestion. You have {result.roundsConsidered} that count so far.
          </p>
          )
        : (
          <>
            <p className="handicap-suggestion-value">{formatIndex(result.index)}</p>
            <p className="handicap-suggestion-note">
              {result.basis === 'rating_slope'
                ? `Worked out from course rating and slope, using the best ${result.roundsUsed} of your last ${result.roundsConsidered} rounds.`
                : 'An estimate: at least one counted round has only a par, not a course rating and slope. Add those for a closer figure.'}
              {' '}This is not an official index, which comes from your club.
            </p>
            {result.clamped && (
              <p className="handicap-suggestion-note">
                The calculation gave {formatIndex(result.unclamped)}, but profiles only hold 0 to 54.
              </p>
            )}
            <button type="button" onClick={handleApply} disabled={busy || alreadySet}>
              {alreadySet ? 'Already your handicap' : busy ? 'Saving…' : `Use ${formatIndex(result.index)} as my handicap`}
            </button>
          </>
          )}

      {result.skipped.length > 0 && (
        <details className="handicap-suggestion-skipped">
          <summary>{result.skipped.length} round{result.skipped.length === 1 ? '' : 's'} left out</summary>
          <ul>
            {result.skipped.map((entry) => (
              <li key={entry.id}>Round {entry.id}: {SKIP_REASONS[entry.reason] || entry.reason}</li>
            ))}
          </ul>
        </details>
      )}

      {error && <p className="friends-message is-error">{error}</p>}
      {message && <p className="friends-message is-success">{message}</p>}
    </section>
  )
}

export default HandicapSuggestion
