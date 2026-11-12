import React from 'react'
import { Link } from 'react-router-dom'

function formatDate (value) {
  if (!value) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function PlayedByList ({ count = 0, friends = [], signedIn = false }) {
  return (
    <div className="played-summary">
      <p className="played-summary-count">
        <span className="played-summary-number">{count}</span>
        {' '}
        player{count === 1 ? '' : 's'} marked this course as played
      </p>

      {!signedIn && (
        <p className="played-by-empty">
          <Link to="/signin">Sign in</Link> to see which of your friends have played here.
        </p>
      )}

      {signedIn && friends.length === 0 && (
        <p className="played-by-empty">
          None of your friends have marked this course yet.
          Add friends from your <Link to="/profile">profile</Link>.
        </p>
      )}

      {signedIn && friends.length > 0 && (
        <>
          <h3 className="played-friends-heading">Friends who&apos;ve played</h3>
          <ul className="played-by-list">
            {friends.map((entry) => {
              const dateLabel = formatDate(entry.date_played)
              return (
                <li key={entry.id} className="played-by-entry">
                  <div className="played-by-entry-top">
                    <Link className="played-by-user" to={`/golfers/${encodeURIComponent(entry.username)}`}>
                      {entry.username}
                    </Link>
                    {dateLabel && (
                      <span className="played-by-date">{dateLabel}</span>
                    )}
                  </div>
                  {entry.rating != null && (
                    <span className="played-by-rating">{entry.rating} / 5</span>
                  )}
                  {entry.notes
                    ? <p className="played-by-notes">{entry.notes}</p>
                    : null}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

export default PlayedByList
