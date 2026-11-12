import React, { useEffect, useMemo, useState } from 'react'

import { addPlayRound, parseScorecard, searchCourses } from '../apiClient'
import { photoToJpeg } from '../lib/image'
import { parForHoles } from '../lib/coursePar'

function sumRange (cells, from, to) {
  const slice = cells.slice(from, to).map((v) => (v === '' ? null : Number(v)))
  return slice.length && slice.every((v) => v != null) ? slice.reduce((a, b) => a + b, 0) : null
}

function validStrokes (value) {
  const n = Number(value)
  return value !== '' && Number.isInteger(n) && n >= 1 && n <= 15
}

function numberOrNull (value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function HoleTable ({ holes, from, to, cells, legible, touched, onChange, label }) {
  const range = holes.slice(from, to)
  if (!range.length) return null
  const hasDistance = range.some((h) => h.distance != null)
  const hasIndex = range.some((h) => h.stroke_index != null)
  const total = sumRange(cells, from, to)

  return (
    <div className="scorecard-table-wrap">
      <table className="scorecard-table" aria-label={`${label} holes`}>
        <thead>
          <tr>
            <th scope="row">Hole</th>
            {range.map((h) => <th key={h.hole} scope="col">{h.hole}</th>)}
            <th scope="col">{label}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Par</th>
            {range.map((h) => <td key={h.hole}>{h.par ?? '–'}</td>)}
            <td>{sumRange(range.map((h) => h.par ?? ''), 0, range.length) ?? '–'}</td>
          </tr>
          {hasDistance && (
            <tr>
              <th scope="row">Dist</th>
              {range.map((h) => <td key={h.hole}>{h.distance ?? '–'}</td>)}
              <td />
            </tr>
          )}
          {hasIndex && (
            <tr>
              <th scope="row">SI</th>
              {range.map((h) => <td key={h.hole}>{h.stroke_index ?? '–'}</td>)}
              <td />
            </tr>
          )}
          <tr>
            <th scope="row">Score</th>
            {range.map((h, offset) => {
              const index = from + offset
              const doubtful = !legible[index] && !touched.has(index)
              return (
                <td key={h.hole} className={doubtful ? 'is-doubtful' : ''}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="15"
                    aria-label={`Hole ${h.hole} score`}
                    value={cells[index]}
                    onChange={(event) => onChange(index, event.target.value)}
                  />
                </td>
              )
            })}
            <td className="scorecard-sum">{total ?? '–'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Photo of a scorecard -> proposal -> editable grid -> saved round. The photo is
// resized in the browser, sent to be read, and never stored. Nothing is saved until
// the golfer has checked every hole and pressed Save.
function ScorecardLogger ({ onSaved }) {
  const [reading, setReading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [proposal, setProposal] = useState(null)
  const [form, setForm] = useState(null)
  const [player, setPlayer] = useState('')
  const [cells, setCells] = useState([])
  const [touched, setTouched] = useState(new Set())
  const [options, setOptions] = useState([])
  const [courseSearch, setCourseSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const reset = () => {
    setProposal(null)
    setForm(null)
    setPlayer('')
    setCells([])
    setTouched(new Set())
    setPreview(null)
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    reset()
    setReading(true)
    try {
      const photo = await photoToJpeg(file)
      const result = await parseScorecard(photo)
      setPreview(typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null)
      setProposal(result)
      setOptions(result.course.candidates)
      const only = result.players.length === 1
      setPlayer(only ? '0' : '')
      setCells(result.players.map((p) => p.scores.map((s) => (s.strokes == null ? '' : String(s.strokes)))))
      setForm({
        courseId: result.course.best ? String(result.course.best.id) : '',
        datePlayed: result.card.date_played || '',
        tee: result.card.tee || '',
        courseRating: result.card.course_rating == null ? '' : String(result.card.course_rating),
        slope: result.card.slope == null ? '' : String(result.card.slope),
        rating: '',
        notes: ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setReading(false)
    }
  }

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const selected = player === '' ? null : Number(player)
  const activeCells = selected == null ? [] : cells[selected] || []
  const holeCount = proposal?.card.hole_count || 0

  const handleCell = (index, value) => {
    const next = cells.map((row) => [...row])
    next[selected][index] = value
    setCells(next)
    setTouched(new Set(touched).add(index))
  }

  const front = sumRange(activeCells, 0, Math.min(9, holeCount))
  const back = holeCount === 18 ? sumRange(activeCells, 9, 18) : null
  const total = holeCount === 18 ? (front != null && back != null ? front + back : null) : front
  const printed = selected == null ? null : proposal?.players[selected]?.printed
  const totalMismatch = total != null && printed?.total != null && printed.total !== total
  const allFilled = activeCells.length === holeCount && activeCells.every(validStrokes)

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

  const canSave = form && form.courseId && form.datePlayed && selected != null && allFilled && !saving

  const handleSave = async (event) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const chosen = options.find((c) => String(c.id) === form.courseId)
      await addPlayRound({
        courseId: Number(form.courseId),
        datePlayed: form.datePlayed,
        rating: numberOrNull(form.rating),
        notes: form.notes,
        score: total,
        holes: holeCount,
        par: proposal.card.par_total ?? parForHoles(chosen, holeCount)?.par ?? null,
        courseRating: numberOrNull(form.courseRating),
        slope: numberOrNull(form.slope),
        tee: form.tee || null,
        holeScores: activeCells.map((value, i) => ({
          hole: i + 1,
          strokes: Number(value),
          par: proposal.card.holes[i]?.par ?? null
        })),
        source: 'scorecard'
      })
      const course = options.find((c) => String(c.id) === form.courseId)
      reset()
      onSaved?.(`Scorecard saved: ${total} at ${course ? course.name : 'the course'}, marked as played.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const legible = useMemo(
    () => (selected == null ? [] : proposal.players[selected].scores.map((s) => s.legible)),
    [proposal, selected]
  )

  return (
    <section className="log-round-box" aria-labelledby="scorecard-heading">
      <h2 id="scorecard-heading">Or photograph your scorecard</h2>
      <p className="help">
        Take a straight, well-lit photo of the whole card. It is read, then you check every hole before anything is
        saved. The photo itself is not kept.
      </p>
      <label className="scorecard-upload">
        <span className="label">Scorecard photo</span>
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={reading} />
      </label>
      {reading && <p className="help">Reading your scorecard…</p>}
      {error && <p className="friends-message is-error" role="alert">{error}</p>}

      {proposal && form && (
        <form onSubmit={handleSave} aria-label="Check your scorecard" className="scorecard-review">
          <h3>Check your scorecard</h3>

          {proposal.demo && <p className="demo-banner" role="status">Demo mode: your photo was not read. This is a sample card.</p>}

          {proposal.warnings.length > 0 && (
            <ul className="log-round-warnings">
              {proposal.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}

          {preview && <img className="scorecard-preview" src={preview} alt="Your scorecard photo, for checking against the grid" />}

          <div className="field">
            <label className="label" htmlFor="sc-courseId">Course</label>
            {proposal.card.course_name && !proposal.course.best && (
              <p className="help">
                {options.length
                  ? `“${proposal.card.course_name}” fits more than one course. Pick the right one.`
                  : `“${proposal.card.course_name}” is not in the course list. Search for it below.`}
              </p>
            )}
            <div className="select is-fullwidth">
              <select id="sc-courseId" name="courseId" value={form.courseId} onChange={handleChange} required>
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
                aria-label="Search for a course from the scorecard"
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
              <label className="label" htmlFor="sc-date">Date played</label>
              <input id="sc-date" className="input" type="date" name="datePlayed" value={form.datePlayed} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="label" htmlFor="sc-tee">Tee</label>
              <input id="sc-tee" className="input" name="tee" value={form.tee} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="label" htmlFor="sc-cr">Course rating</label>
              <input id="sc-cr" className="input" type="number" step="0.1" name="courseRating" value={form.courseRating} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="label" htmlFor="sc-slope">Slope</label>
              <input id="sc-slope" className="input" type="number" name="slope" value={form.slope} onChange={handleChange} />
            </div>
          </div>

          <fieldset className="scorecard-players">
            <legend className="label">Which row is you?</legend>
            {proposal.players.map((p, index) => (
              <label key={index} className="radio">
                <input
                  type="radio"
                  name="scorecard-player"
                  value={String(index)}
                  checked={player === String(index)}
                  onChange={(event) => setPlayer(event.target.value)}
                />
                {' '}{p.name || `Player ${index + 1}`}
                {p.total != null ? ` (${p.total})` : ''}
                {p.mismatch ? ' – check' : ''}
              </label>
            ))}
          </fieldset>

          {selected != null && (
            <>
              <HoleTable
                holes={proposal.card.holes} from={0} to={Math.min(9, holeCount)} label="Out"
                cells={activeCells} legible={legible} touched={touched} onChange={handleCell}
              />
              {holeCount === 18 && (
                <HoleTable
                  holes={proposal.card.holes} from={9} to={18} label="In"
                  cells={activeCells} legible={legible} touched={touched} onChange={handleCell}
                />
              )}
              <p className="scorecard-total">
                Total: <strong>{total ?? '–'}</strong>
                {proposal.card.par_total != null && total != null && ` (par ${proposal.card.par_total}, ${total - proposal.card.par_total >= 0 ? '+' : ''}${total - proposal.card.par_total})`}
              </p>
              {totalMismatch && (
                <p className="help is-danger">The card says {printed.total}, but the holes add to {total}. One of them is misread.</p>
              )}
              {!allFilled && <p className="help">Fill in every hole (1 to 15 strokes) to save.</p>}
            </>
          )}

          <div className="field">
            <label className="label" htmlFor="sc-notes">Notes</label>
            <textarea id="sc-notes" className="textarea" name="notes" value={form.notes} onChange={handleChange} rows={2} />
          </div>

          <div className="log-round-actions">
            <button type="submit" disabled={!canSave}>{saving ? 'Saving…' : 'Save round'}</button>
            <button type="button" className="log-round-secondary" onClick={reset}>Discard</button>
          </div>
        </form>
      )}
    </section>
  )
}

export default ScorecardLogger
