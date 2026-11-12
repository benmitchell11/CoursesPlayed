import React, { useState, useEffect, useCallback, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'

import {
  getCourse,
  getCoursePlayedSummary,
  hasMarkedCourse,
  markCoursePlayed,
  unmarkCoursePlayed,
  addPlayRound
} from '../apiClient'
import { UserContext } from '../context/UserContext'
import MarkPlayedForm from '../components/MarkPlayedForm'
import PlayedByList from '../components/PlayedByList'
import '../styles/CourseDetail.css'

function CourseDetail () {
  const { user } = useContext(UserContext) || {}
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [playedSummary, setPlayedSummary] = useState({ count: 0, friends: [] })
  const [hasPlayed, setHasPlayed] = useState(false)
  const [markBusy, setMarkBusy] = useState(false)
  const [markMessage, setMarkMessage] = useState(null)
  const [markError, setMarkError] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadPlayedSummary = useCallback(() => {
    getCoursePlayedSummary(id)
      .then(setPlayedSummary)
      .catch((err) => setError(err.message))
  }, [id])

  const loadMarkStatus = useCallback(() => {
    if (!user) {
      setHasPlayed(false)
      return Promise.resolve()
    }
    return hasMarkedCourse(id)
      .then(setHasPlayed)
      .catch((err) => setError(err.message))
  }, [id, user])

  useEffect(() => {
    setLoading(true)
    getCourse(id)
      .then(setCourse)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    loadPlayedSummary()
    loadMarkStatus()
  }, [id, loadPlayedSummary, loadMarkStatus, user?.id])

  const handleTogglePlayed = async () => {
    setMarkBusy(true)
    setMarkMessage(null)
    setMarkError(false)
    try {
      if (hasPlayed) {
        await unmarkCoursePlayed(Number(id))
        setHasPlayed(false)
        setMarkMessage('Removed from courses played.')
      } else {
        await markCoursePlayed({ courseId: Number(id) })
        setHasPlayed(true)
        setMarkMessage('Marked as played.')
      }
      loadPlayedSummary()
    } catch (err) {
      setMarkError(true)
      setMarkMessage(err.message)
    } finally {
      setMarkBusy(false)
    }
  }

  const handleLogRound = async (entry) => {
    await addPlayRound({ ...entry, courseId: Number(id) })
    setHasPlayed(true)
    loadPlayedSummary()
  }

  if (error) {
    return (
      <main className="course-detail-page">
        <div className="container">
          <Link className="course-detail-back" to="/courses">← Back to courses</Link>
          <p className="mark-played-message is-error">{error}</p>
        </div>
      </main>
    )
  }

  if (loading || !course) {
    return (
      <main className="course-detail-page">
        <div className="container">
          <p>Loading course…</p>
        </div>
      </main>
    )
  }

  const hasCoords = course.lat != null && course.lng != null

  return (
    <main className="course-detail-page">
      <div className="container">
        <Link className="course-detail-back" to="/courses">← Back to courses</Link>

        <header className="course-detail-hero">
          <p className="course-detail-eyebrow">Course</p>
          <h1>{course.name}</h1>
          <p className="course-detail-location">{course.city}, {course.country}</p>
          <div className="course-detail-meta">
            <span className="course-detail-meta-item">
              {playedSummary.count} player{playedSummary.count === 1 ? '' : 's'} played
            </span>
            {course.holes && (
              <span className="course-detail-meta-item">{course.holes} holes</span>
            )}
            {course.par && (
              <span
                className="course-detail-meta-item"
                title={course.par_source === 'osm' ? 'Approximate: from OpenStreetMap, not an official figure' : undefined}
              >
                Par {course.par}{course.par_source === 'osm' ? ' (approx.)' : ''}
              </span>
            )}
            {hasCoords && (
              <Link className="course-detail-meta-item" to="/map">
                View on map →
              </Link>
            )}
          </div>
        </header>

        {(course.website || course.phone || course.email || course.opening_hours) && (
          <section className="course-detail-panel course-detail-info" aria-labelledby="course-info-heading">
            <h2 id="course-info-heading">Course info</h2>
            <dl className="course-info-list">
              {course.website && (
                <>
                  <dt>Website</dt>
                  <dd>
                    <a href={course.website} target="_blank" rel="noreferrer">
                      {course.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </dd>
                </>
              )}
              {course.phone && (
                <>
                  <dt>Phone</dt>
                  <dd><a href={`tel:${course.phone}`}>{course.phone}</a></dd>
                </>
              )}
              {course.email && (
                <>
                  <dt>Email</dt>
                  <dd><a href={`mailto:${course.email}`}>{course.email}</a></dd>
                </>
              )}
              {course.opening_hours && (
                <>
                  <dt>Hours</dt>
                  <dd>{course.opening_hours}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        <div className="course-detail-layout">
          <div className="course-detail-actions">
            <section className="course-detail-panel" aria-labelledby="mark-played-heading">
              <h2 id="mark-played-heading">Played status</h2>
              {user
                ? (
                  <>
                    <p className="mark-played-hint">
                      Mark courses you&apos;ve played — even years ago — without logging a round.
                    </p>
                    <button
                      type="button"
                      className={`mark-played-toggle${hasPlayed ? ' is-played' : ''}`}
                      onClick={handleTogglePlayed}
                      disabled={markBusy}
                      aria-pressed={hasPlayed}
                    >
                      {hasPlayed ? 'Played ✓' : 'Mark as played'}
                    </button>
                    {markMessage && (
                      <p className={`mark-played-message ${markError ? 'is-error' : 'is-success'}`}>
                        {markMessage}
                      </p>
                    )}
                  </>
                  )
                : (
                  <p className="course-detail-signin">
                    <Link to="/signin">Sign in</Link> to mark this course as played.
                  </p>
                  )}
            </section>

            <section className="course-detail-panel" aria-labelledby="log-round-heading">
              {user
                ? <MarkPlayedForm onSubmit={handleLogRound} />
                : (
                  <>
                    <h2 id="log-round-heading">Log a round</h2>
                    <p className="course-detail-signin">
                      <Link to="/signin">Sign in</Link> to add a round to your play log.
                    </p>
                  </>
                  )}
            </section>
          </div>

          <section className="course-detail-panel" aria-labelledby="played-by-heading">
            <h2 id="played-by-heading">Played by</h2>
            <PlayedByList
              count={playedSummary.count}
              friends={playedSummary.friends}
              signedIn={Boolean(user)}
            />
          </section>
        </div>
      </div>
    </main>
  )
}

export default CourseDetail
