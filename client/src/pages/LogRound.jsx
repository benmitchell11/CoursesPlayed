import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { addPlayRound, getMyPlayRounds, parseRound, searchCourses, updateHandicap } from '../apiClient'
import HandicapSuggestion from '../components/HandicapSuggestion'
import { parForHoles } from '../lib/coursePar'
import ScorecardLogger from '../components/ScorecardLogger'
import { UserContext } from '../context/UserContext'
import '../styles/LogRound.css'

const MAX_LENGTH = 600
const EXAMPLE = 'Played Titirangi yesterday, shot 92 off the white tees, windy but loved the back nine'

function toNumberOrNull (value) {
  if (value === '' || value == null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function courseListPar (course, holes) {
  const found = parForHoles(course, holes)
  return found ? { par: found.par, note: `Par ${found.par} filled in from ${found.basis}.` } : null
}

function formFromProposal (proposal) {
  const { round } = proposal
  const text = (value) => (value == null ? '' : String(value))
  const fromCourse = round.par == null ? courseListPar(proposal.course.best, round.holes ?? 18) : null
  return {
    courseId: proposal.course.best ? String(proposal.course.best.id) : '',
    datePlayed: text(round.date_played),
    holes: text(round.holes ?? 18),
    score: text(round.score),
    rating: text(round.rating),
    par: text(round.par ?? fromCourse?.par),
    courseRating: text(round.course_rating),
    slope: text(round.slope),
    notes: round.notes || ''
  }
}

function LogRound () {
  const { user, setUser } = useContext(UserContext)
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [proposal, setProposal] = useState(null)
  const [form, setForm] = useState(null)
  const [options, setOptions] = useState([])
  const [courseSearch, setCourseSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(null)
  const [rounds, setRounds] = useState([])
  const [parNote, setParNote] = useState(null)

  const refreshRounds = useCallback(() => {
    return getMyPlayRounds().then(setRounds).catch(() => {})
  }, [])

  useEffect(() => {
    refreshRounds()
  }, [refreshRounds])

  const handleParse = async (event) => {
    event.preventDefault()
    setError(null)
    setSaved(null)
    setParsing(true)
    try {
      const result = await parseRound(text)
      setProposal(result)
      setForm(formFromProposal(result))
      setParNote(result.round.par == null ? courseListPar(result.course.best, result.round.holes ?? 18)?.note ?? null : null)
      setOptions(result.course.candidates)
    } catch (err) {
      setProposal(null)
      setForm(null)
      setError(err.message)
    } finally {
      setParsing(false)
    }
  }

  // Par from the course list follows the course and hole count until the golfer
  // types their own (or the text gave one), after which it is left alone.
  const handleChange = (event) => {
    const { name, value } = event.target
    const next = { ...form, [name]: value }
    if (name === 'par') {
      setParNote(null)
    } else if ((name === 'courseId' || name === 'holes') && (parNote || form.par === '')) {
      const course = options.find((c) => String(c.id) === next.courseId)
      const found = courseListPar(course, Number(next.holes))
      next.par = found ? String(found.par) : ''
      setParNote(found ? found.note : null)
    }
    setForm(next)
  }

  const handleCourseSearch = async () => {
    if (!courseSearch.trim()) return
    setError(null)
    try {
      const found = await searchCourses({ search: courseSearch.trim() })
      const merged = new Map(options.map((c) => [c.id, c]))
      for (const course of found.slice(0, 20)) {
        merged.set(course.id, {
          id: course.id, name: course.name, city: course.city,
          par: course.par ?? null, holes: course.holes ?? null, hole_pars: course.hole_pars ?? null
        })
      }
      setOptions([...merged.values()])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await addPlayRound({
        courseId: Number(form.courseId),
        datePlayed: form.datePlayed,
        rating: toNumberOrNull(form.rating),
        notes: form.notes,
        score: toNumberOrNull(form.score),
        holes: toNumberOrNull(form.holes),
        par: toNumberOrNull(form.par),
        courseRating: toNumberOrNull(form.courseRating),
        slope: toNumberOrNull(form.slope)
      })
      const course = options.find((c) => String(c.id) === form.courseId)
      setSaved(`Round saved. ${course ? course.name : 'The course'} is marked as played.`)
      setProposal(null)
      setForm(null)
      setText('')
      await refreshRounds()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const applyHandicap = async (index) => {
    const updated = await updateHandicap(index)
    setUser(updated)
  }

  const canSave = form && form.courseId && form.datePlayed && !saving

  return (
    <main className="log-round-page">
      <div className="container">
        <h1>Log a round</h1>
        <p className="log-round-intro">
          Describe your round in your own words. Nothing is saved until you check it and press Save.
        </p>

        <form className="log-round-box" onSubmit={handleParse}>
          <label className="label" htmlFor="round-text">Your round</label>
          <textarea
            id="round-text"
            className="textarea"
            value={text}
            maxLength={MAX_LENGTH}
            onChange={(event) => setText(event.target.value)}
            placeholder={EXAMPLE}
            rows={3}
          />
          <div className="log-round-actions">
            <button type="submit" disabled={parsing || text.trim().length < 3}>
              {parsing ? 'Reading…' : 'Read my round'}
            </button>
            <span className="log-round-count">{text.length}/{MAX_LENGTH}</span>
          </div>
        </form>

        {error && <p className="friends-message is-error" role="alert">{error}</p>}
        {saved && <p className="friends-message is-success">{saved}</p>}

        {proposal && form && (
          <form className="log-round-box" onSubmit={handleSave} aria-label="Check your round">
            <h2>Check your round</h2>

            {proposal.demo && <p className="demo-banner" role="status">Demo mode: this was read by simple rules, not an AI model.</p>}

            {proposal.warnings.length > 0 && (
              <ul className="log-round-warnings">
                {proposal.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            )}

            <div className="field">
              <label className="label" htmlFor="courseId">Course</label>
              {proposal.round.course_name && !proposal.course.best && (
                <p className="help">
                  {options.length
                    ? `“${proposal.round.course_name}” fits more than one course. Pick the right one.`
                    : `“${proposal.round.course_name}” is not in the course list. Search for it below.`}
                </p>
              )}
              <div className="select is-fullwidth">
                <select id="courseId" name="courseId" value={form.courseId} onChange={handleChange} required>
                  <option value="">Choose a course…</option>
                  {options.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}{course.city && course.city !== 'New Zealand' ? `, ${course.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="log-round-search">
                <input
                  className="input"
                  type="search"
                  aria-label="Search for a course"
                  placeholder="Search for a different course"
                  value={courseSearch}
                  onChange={(event) => setCourseSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleCourseSearch()
                    }
                  }}
                />
                <button type="button" onClick={handleCourseSearch}>Search</button>
              </div>
            </div>

            <div className="log-round-grid">
              <div className="field">
                <label className="label" htmlFor="datePlayed">Date played</label>
                <input id="datePlayed" className="input" type="date" name="datePlayed" value={form.datePlayed} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="holes">Holes</label>
                <div className="select is-fullwidth">
                  <select id="holes" name="holes" value={form.holes} onChange={handleChange}>
                    <option value="18">18</option>
                    <option value="9">9</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="score">Score (total strokes)</label>
                <input id="score" className="input" type="number" min="1" name="score" value={form.score} onChange={handleChange} />
              </div>
              <div className="field">
                <label className="label" htmlFor="rating">Rating</label>
                <div className="select is-fullwidth">
                  <select id="rating" name="rating" value={form.rating} onChange={handleChange}>
                    <option value="">No rating</option>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
                  </select>
                </div>
              </div>
            </div>

            <details className="log-round-details">
              <summary>Handicap details (optional)</summary>
              <p className="help">Par, or course rating and slope, let this round count toward a handicap suggestion.</p>
              <div className="log-round-grid">
                <div className="field">
                  <label className="label" htmlFor="par">Par</label>
                  <input id="par" className="input" type="number" name="par" value={form.par} onChange={handleChange} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="courseRating">Course rating</label>
                  <input id="courseRating" className="input" type="number" step="0.1" name="courseRating" value={form.courseRating} onChange={handleChange} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="slope">Slope</label>
                  <input id="slope" className="input" type="number" name="slope" value={form.slope} onChange={handleChange} />
                </div>
              </div>
            </details>

            <div className="field">
              <label className="label" htmlFor="notes">Notes</label>
              <textarea id="notes" className="textarea" name="notes" value={form.notes} onChange={handleChange} rows={2} />
            </div>

            {parNote && (
              <p className="help">
                {parNote} It is approximate, so change it under Handicap details if your scorecard says otherwise.
              </p>
            )}
            {!form.score && <p className="help">No score yet. This round won&apos;t count toward a handicap.</p>}

            <div className="log-round-actions">
              <button type="submit" disabled={!canSave}>{saving ? 'Saving…' : 'Save round'}</button>
              <button type="button" className="log-round-secondary" onClick={() => { setProposal(null); setForm(null) }}>
                Discard
              </button>
            </div>
          </form>
        )}

        <ScorecardLogger onSaved={(message) => { setSaved(message); refreshRounds() }} />

        <HandicapSuggestion rounds={rounds} currentHandicap={user?.handicap} onApply={applyHandicap} />

        <p className="log-round-footer">
          Prefer the form? Open a <Link to="/courses">course</Link> and use “Log a round”.
        </p>
      </div>
    </main>
  )
}

export default LogRound
