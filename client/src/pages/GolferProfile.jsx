import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import {
  acceptFriendRequest,
  getFriendshipStatus,
  getPlayedCoursesForUser,
  getPlayRoundsForUser,
  getUserByUsername,
  sendFriendRequest
} from '../apiClient'
import { UserContext } from '../context/UserContext'
import '../styles/Golfers.css'

function formatHandicap (value) {
  if (value == null || value === '') return '—'
  return Number(value).toFixed(1).replace(/\.0$/, '')
}

function GolferProfile () {
  const { username } = useParams()
  const { user } = useContext(UserContext) || {}
  const [profile, setProfile] = useState(null)
  const [playedCourses, setPlayedCourses] = useState([])
  const [rounds, setRounds] = useState([])
  const [friendship, setFriendship] = useState({ status: 'none' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [friendBusy, setFriendBusy] = useState(false)
  const [friendMessage, setFriendMessage] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setFriendMessage(null)
    try {
      const found = await getUserByUsername(username)
      if (!found) {
        setProfile(null)
        setPlayedCourses([])
        setRounds([])
        return
      }

      setProfile(found)
      const [courses, playRounds, status] = await Promise.all([
        getPlayedCoursesForUser(found.id),
        getPlayRoundsForUser(found.id),
        user ? getFriendshipStatus(found.id) : Promise.resolve({ status: 'none' })
      ])
      setPlayedCourses(courses)
      setRounds(playRounds)
      setFriendship(status)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [username, user])

  useEffect(() => {
    load()
  }, [load])

  if (user && profile && friendship.status === 'self') {
    return <Navigate to="/profile" replace />
  }

  const handleAddFriend = async () => {
    if (!profile) return
    setFriendBusy(true)
    setFriendMessage(null)
    try {
      await sendFriendRequest(profile.username)
      setFriendMessage('Friend request sent.')
      const status = await getFriendshipStatus(profile.id)
      setFriendship(status)
    } catch (err) {
      setFriendMessage(err.message)
    } finally {
      setFriendBusy(false)
    }
  }

  const handleAccept = async () => {
    if (!friendship.requestId) return
    setFriendBusy(true)
    setFriendMessage(null)
    try {
      await acceptFriendRequest(friendship.requestId)
      setFriendMessage('You are now friends.')
      setFriendship({ status: 'friends', requestId: friendship.requestId })
    } catch (err) {
      setFriendMessage(err.message)
    } finally {
      setFriendBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="golfers-page">
        <div className="container">
          <p>Loading golfer…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="golfers-page">
        <div className="container">
          <Link className="golfers-back" to="/golfers">← Back to golfers</Link>
          <p className="golfers-message is-error">{error}</p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="golfers-page">
        <div className="container">
          <Link className="golfers-back" to="/golfers">← Back to golfers</Link>
          <h1>Golfer not found</h1>
          <p className="golfers-message">No account matches that username.</p>
        </div>
      </main>
    )
  }

  const showRounds = friendship.status === 'friends' || friendship.status === 'self'

  return (
    <main className="golfers-page">
      <div className="container">
        <Link className="golfers-back" to="/golfers">← Back to golfers</Link>

        <header className="golfer-profile-hero">
          <p className="golfers-eyebrow">Golfer</p>
          <h1>{profile.username}</h1>
          <div className="golfer-profile-stats">
            <div>
              <p className="golfer-stat-label">Handicap</p>
              <p className="golfer-stat-value">{formatHandicap(profile.handicap)}</p>
            </div>
            <div>
              <p className="golfer-stat-label">Courses played</p>
              <p className="golfer-stat-value">{playedCourses.length}</p>
            </div>
            <div>
              <p className="golfer-stat-label">Rounds logged</p>
              <p className="golfer-stat-value">{rounds.length}</p>
            </div>
          </div>

          {user
            ? (
              <div className="golfer-friend-actions">
                {friendship.status === 'none' && (
                  <button type="button" onClick={handleAddFriend} disabled={friendBusy}>
                    Add friend
                  </button>
                )}
                {friendship.status === 'pending_sent' && (
                  <p className="golfers-message">Friend request sent</p>
                )}
                {friendship.status === 'pending_received' && (
                  <button type="button" onClick={handleAccept} disabled={friendBusy}>
                    Accept friend request
                  </button>
                )}
                {friendship.status === 'friends' && (
                  <p className="golfers-message is-success">Friends</p>
                )}
                {friendMessage && (
                  <p className={`golfers-message ${/not found|cannot|already|error|fail|required/i.test(friendMessage) ? 'is-error' : 'is-success'}`}>
                    {friendMessage}
                  </p>
                )}
              </div>
              )
            : (
              <p className="golfers-message">
                <Link to="/signin">Sign in</Link> to add {profile.username} as a friend.
              </p>
              )}
        </header>

        <section className="golfer-panel" aria-labelledby="courses-played-heading">
          <h2 id="courses-played-heading">Courses played</h2>
          {!playedCourses.length
            ? <p className="golfers-message">No courses marked as played yet.</p>
            : (
              <ul className="golfer-course-list">
                {playedCourses.map((course) => (
                  <li key={course.id}>
                    <Link to={`/courses/${course.course_id}`}>{course.course_name}</Link>
                    {(course.city || course.country) && (
                      <span>{[course.city, course.country].filter(Boolean).join(', ')}</span>
                    )}
                  </li>
                ))}
              </ul>
              )}
        </section>

        <section className="golfer-panel" aria-labelledby="play-log-heading">
          <h2 id="play-log-heading">Play log</h2>
          {!showRounds && (
            <p className="golfers-message">
              Become friends with {profile.username} to see their round details.
            </p>
          )}
          {showRounds && !rounds.length && (
            <p className="golfers-message">No rounds logged yet.</p>
          )}
          {showRounds && rounds.length > 0 && (
            <table className="golfer-play-log">
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

export default GolferProfile
