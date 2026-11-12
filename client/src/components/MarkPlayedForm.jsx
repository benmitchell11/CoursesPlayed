import React, { useState } from 'react'

function today () {
  return new Date().toISOString().slice(0, 10)
}

function MarkPlayedForm ({ onSubmit }) {
  const [form, setForm] = useState({ datePlayed: today(), rating: '4', notes: '' })
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await onSubmit({
        ...form,
        rating: form.rating === '' ? null : Number(form.rating)
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="mark-played-form" onSubmit={handleSubmit}>
      <h2 id="log-round-heading">Log a round</h2>
      <p className="mark-played-hint">
        Optional — add a date, rating, and notes for your play log.
      </p>

      <div className="field">
        <label className="label" htmlFor="datePlayed">Date played</label>
        <input
          id="datePlayed"
          className="input"
          type="date"
          name="datePlayed"
          value={form.datePlayed}
          onChange={handleChange}
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="rating">Rating</label>
        <div className="select">
          <select id="rating" name="rating" value={form.rating} onChange={handleChange}>
            <option value="">No rating</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} / 5</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          className="textarea"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Optional thoughts on the round"
        />
      </div>

      <div className="mark-played-actions">
        <button type="submit" className="mark-played-submit">Save round</button>
        {error && <p className="mark-played-message is-error">{error}</p>}
        {saved && !error && <p className="mark-played-message is-success">Round saved!</p>}
      </div>
    </form>
  )
}

export default MarkPlayedForm
