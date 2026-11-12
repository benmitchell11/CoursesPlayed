import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { searchUsers } from '../apiClient'
import { UserContext } from '../context/UserContext'
import '../styles/Golfers.css'

function formatHandicap (value) {
  if (value == null || value === '') return null
  return Number(value).toFixed(1).replace(/\.0$/, '')
}

function GolfersPage () {
  const { user } = useContext(UserContext) || {}
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const handle = window.setTimeout(() => {
      searchUsers(term)
        .then((users) => {
          if (!cancelled) setResults(users)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, term ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [term])

  return (
    <main className="golfers-page">
      <div className="container">
        <header className="golfers-header">
          <p className="golfers-eyebrow">Community</p>
          <h1>Find golfers</h1>
          <p className="golfers-intro">
            Search by username, add friends, and see which courses they&apos;ve played.
          </p>
        </header>

        <form className="golfers-search" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="golfer-search">Search golfers</label>
          <input
            id="golfer-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by username"
            autoComplete="off"
          />
        </form>

        {error && <p className="golfers-message is-error">{error}</p>}
        {loading && <p className="golfers-message">Searching…</p>}

        {!loading && !error && results.length === 0 && (
          <p className="golfers-message">
            {term.trim()
              ? 'No golfers matched that username.'
              : 'No golfers found yet.'}
          </p>
        )}

        {!loading && results.length > 0 && (
          <ul className="golfers-list">
            {results.map((golfer) => {
              const handicap = formatHandicap(golfer.handicap)
              const isYou = user && golfer.id === user.id
              return (
                <li key={golfer.id}>
                  <Link
                    className="golfers-card"
                    to={isYou ? '/profile' : `/golfers/${encodeURIComponent(golfer.username)}`}
                  >
                    <span className="golfers-card-name">
                      {golfer.username}
                      {isYou ? ' (you)' : ''}
                    </span>
                    <span className="golfers-card-meta">
                      {handicap != null ? `HCP ${handicap}` : 'No handicap set'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {user && (
          <p className="golfers-footer">
            Looking for your own page? <Link to="/profile">Open your profile</Link>
            {' '}or{' '}
            <Link to={`/golfers/${encodeURIComponent(user.username)}`}>view it as others see it</Link>.
          </p>
        )}
      </div>
    </main>
  )
}

export default GolfersPage
