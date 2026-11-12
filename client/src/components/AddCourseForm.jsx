import React, { useState, useEffect } from 'react'

function AddCourseForm ({ pendingLocation, onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', city: '', country: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
  }, [pendingLocation])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!pendingLocation) {
      setError('Click on the map to set the course location first')
      return
    }
    setError(null)
    try {
      await onSubmit({ ...form, lat: pendingLocation.lat, lng: pendingLocation.lng })
      setForm({ name: '', city: '', country: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="box" onSubmit={handleSubmit}>
      <h2 className="title is-5">Add a course</h2>
      <p className="help">Click a spot on the map to set its location, then fill in the details.</p>

      {error && <p className="help is-danger">{error}</p>}

      <div className="field">
        <input className="input" name="name" placeholder="Course name" value={form.name} onChange={handleChange} required />
      </div>
      <div className="field">
        <input className="input" name="city" placeholder="City" value={form.city} onChange={handleChange} required />
      </div>
      <div className="field">
        <input className="input" name="country" placeholder="Country" value={form.country} onChange={handleChange} required />
      </div>

      {pendingLocation && (
        <p className="help">
          Location: {pendingLocation.lat.toFixed(4)}, {pendingLocation.lng.toFixed(4)}
        </p>
      )}

      <div className="field is-grouped">
        <div className="control">
          <button type="submit" className="button is-primary">Add course</button>
        </div>
        <div className="control">
          <button type="button" className="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  )
}

export default AddCourseForm
