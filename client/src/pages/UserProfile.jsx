import React, { useState, useEffect, useCallback, useContext } from 'react'
import { Link } from 'react-router-dom'

import {
  getMyPlayedCourses,
  getMyPlayRounds,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  updateHandicap
} from '../apiClient'
import HandicapSuggestion from '../components/HandicapSuggestion'
import { UserContext } from '../context/UserContext'
import '../styles/UserProfile.css'

function formatHandicap (value) {
  if (value == null || value === '') return '—'
  return Number(value).toFixed(1).replace(/\.0$/, '')
}

function UserProfile () {
  const { user, setUser } = useContext(UserContext)
  const [playedCourses, setPlayedCourses] = useState([])
  const [rounds, setRounds] = useState([])
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [friendUsername, setFriendUsername] = useState('')
  const [friendMessage, setFriendMessage] = useState(null)
  const [friendError, setFriendError] = useState(null)
  const [handicapInput, setHandicapInput] = useState('')
  const [handicapMessage, setHandicapMessage] = useState(null)
  const [handicapError, setHandicapError] = useState(null)
  const [handicapBusy, setHandicapBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setHandicapInput(user?.handicap == null ? '' : String(user.handicap))
  }, [user?.handicap])

  const loadFriends = useCallback(() => {
    return getFriends()
      .then((data) => {
        setFriends(data.friends || [])
        setPending(data.pending || [])
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    getMyPlayedCourses().then(setPlayedCourses).catch((err) => setError(err.message))
    getMyPlayRounds().then(setRounds).catch((err) => setError(err.message))
    loadFriends()
  }, [loadFriends])

  const handleSaveHandicap = async (event) => {
    event.preventDefault()
    setHandicapError(null)
    setHandicapMessage(null)
    setHandicapBusy(true)
    try {
      const updated = await updateHandicap(handicapInput.trim() === '' ? null : handicapInput)
      setUser(updated)
      setHandicapMessage(updated.handicap == null ? 'Handicap cleared.' : 'Handicap saved.')
    } catch (err) {
      setHandicapError(err.message)
    } finally {
      setHandicapBusy(false)
    }
  }

  const applySuggestedHandicap = async (index) => {
    const updated = await updateHandicap(index)
    setUser(updated)
  }

  const handleAddFriend = async (event) => {
    event.preventDefault()
    setFriendError(null)
    setFriendMessage(null)
    try {
      await sendFriendRequest(friendUsername.trim())
      setFriendUsername('')
      setFriendMessage('Friend request sent.')
      await loadFriends()
    } catch (err) {
      setFriendError(err.message)
    }
  }

  const handleAccept = async (requestId) => {
    setFriendError(null)
    setFriendMessage(null)
    try {
      await acceptFriendRequest(requestId)
      setFriendMessage('Friend request accepted.')
      await loadFriends()
    } catch (err) {
      setFriendError(err.message)
    }
  }

  const ratedRounds = rounds.filter((entry) => entry.rating != null)
  const averageRating = ratedRounds.length
    ? (ratedRounds.reduce((sum, entry) => sum + entry.rating, 0) / ratedRounds.length).toFixed(1)
    : null

  return (
    <main className="user-profile-page">
      <div className="container">
        <h1>{user?.username}&apos;s Profile</h1>

        {error && <p className="friends-message is-error">{error}</p>}

        <div className="user-profile-stats">
          <div className="user-profile-stat">
            <p className="user-profile-stat-label">Handicap</p>
            <p className="user-profile-stat-value">{formatHandicap(user?.handicap)}</p>
          </div>
          <div className="user-profile-stat">
            <p className="user-profile-stat-label">Courses played</p>
            <p className="user-profile-stat-value">{playedCourses.length}</p>
          </div>
          <div className="user-profile-stat">
            <p className="user-profile-stat-label">Rounds logged</p>
            <p className="user-profile-stat-value">{rounds.length}</p>
          </div>
          <div className="user-profile-stat">
            <p className="user-profile-stat-label">Average rating</p>
            <p className="user-profile-stat-value">{averageRating ?? '—'}</p>
          </div>
        </div>

        <div className="user-profile-panel">
          <HandicapSuggestion rounds={rounds} currentHandicap={user?.handicap} onApply={applySuggestedHandicap} />
        </div>

        <section className="user-profile-panel" aria-labelledby="handicap-heading">
          <h2 id="handicap-heading">Handicap</h2>
          <p className="handicap-hint">
            Add your current handicap index (0–54). Leave blank to clear it.
          </p>
          <form className="handicap-form" onSubmit={handleSaveHandicap}>
            <label className="sr-only" htmlFor="handicap">Handicap</label>
            <input
              id="handicap"
              type="number"
              inputMode="decimal"
              min="0"
              max="54"
              step="0.1"
              value={handicapInput}
              onChange={(event) => setHandicapInput(event.target.value)}
              placeholder="e.g. 18.4"
            />
            <button type="submit" disabled={handicapBusy}>
              {handicapBusy ? 'Saving…' : 'Save handicap'}
            </button>
          </form>
          {handicapError && <p className="friends-message is-error">{handicapError}</p>}
          {handicapMessage && <p className="friends-message is-success">{handicapMessage}</p>}
        </section>

        <section className="user-profile-panel" aria-labelledby="friends-heading">
          <h2 id="friends-heading">Friends</h2>
          <p className="handicap-hint">
            Search people on the <Link to="/golfers">Golfers</Link> page, or add by username below.
          </p>

          <form className="friends-add" onSubmit={handleAddFriend}>
            <input
              type="text"
              value={friendUsername}
              onChange={(event) => setFriendUsername(event.target.value)}
              placeholder="Add friend by username"
              aria-label="Friend username"
              required
            />
            <button type="submit">Add friend</button>
          </form>

          {friendError && <p className="friends-message is-error">{friendError}</p>}
          {friendMessage && <p className="friends-message is-success">{friendMessage}</p>}

          {pending.length > 0 && (
            <div className="friends-subsection">
              <h3>Pending requests</h3>
              <ul className="friends-list">
                {pending.map((request) => (
                  <li key={request.id} className="friends-list-item">
                    <Link to={`/golfers/${encodeURIComponent(request.username)}`}>{request.username}</Link>
                    <button type="button" className="friends-accept" onClick={() => handleAccept(request.id)}>
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="friends-subsection">
            <h3>Your friends</h3>
            {friends.length === 0
              ? <p className="friends-empty">No friends yet. <Link to="/golfers">Find golfers</Link> to add.</p>
              : (
                <ul className="friends-list">
                  {friends.map((friend) => (
                    <li key={friend.id} className="friends-list-item">
                      <Link to={`/golfers/${encodeURIComponent(friend.username)}`}>{friend.username}</Link>
                    </li>
                  ))}
                </ul>
                )}
          </div>
        </section>

        <section className="user-profile-panel" aria-labelledby="courses-played-heading">
          <h2 id="courses-played-heading">Courses played</h2>

          {!playedCourses.length && (
            <p className="play-log-empty">
              You haven&apos;t marked any courses as played yet. <Link to="/courses">Find one</Link>.
            </p>
          )}

          {playedCourses.length > 0 && (
            <ul className="played-courses-list">
              {playedCourses.map((course) => (
                <li key={course.id}>
                  <Link to={`/courses/${course.course_id}`}>{course.course_name}</Link>
                  {(course.city || course.country) && (
                    <span>
                      {[course.city, course.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="user-profile-panel" aria-labelledby="play-log-heading">
          <h2 id="play-log-heading">Play log</h2>

          {!rounds.length && (
            <p className="play-log-empty">
              No rounds logged yet. Open a course to add one to your play log.
            </p>
          )}

          {rounds.length > 0 && (
            <table className="play-log-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Rating</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((entry) => (
                  <tr key={entry.id}>
                    <td><Link to={`/courses/${entry.course_id}`}>{entry.course_name}</Link></td>
                    <td>{entry.date_played}</td>
                    <td>{entry.rating ? `${entry.rating} / 5` : '—'}</td>
                    <td>{entry.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  )
}

export default UserProfile
