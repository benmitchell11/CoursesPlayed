import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { register } from '../apiClient'
import { UserContext } from '../context/UserContext'

function Register () {
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState(null)
  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      const user = await register(form)
      setUser(user)
      navigate('/map')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <form className="box" style={{ maxWidth: '400px', margin: '2rem auto' }} onSubmit={handleSubmit}>
        <h1 className="title">Register</h1>

        {error && <p className="help is-danger">{error}</p>}

        <div className="field">
          <input
            className="input" name="email" placeholder="Email" type="email"
            value={form.email} onChange={handleChange} required
          />
        </div>

        <div className="field">
          <input
            className="input" name="username" placeholder="Username" type="text"
            value={form.username} onChange={handleChange} required
          />
        </div>

        <div className="field">
          <input
            className="input" name="password" placeholder="Password" type="password"
            value={form.password} onChange={handleChange} required
          />
        </div>

        <button type="submit" className="button is-primary is-fullwidth">Register</button>

        <p className="has-text-centered" style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>
      </form>
    </div>
  )
}

export default Register
