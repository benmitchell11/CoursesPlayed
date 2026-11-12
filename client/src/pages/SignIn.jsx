import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { signIn } from '../apiClient'
import { UserContext } from '../context/UserContext'

function SignIn () {
  const [form, setForm] = useState({ username: '', password: '' })
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
      const user = await signIn(form)
      setUser(user)
      navigate('/map')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <form className="box" style={{ maxWidth: '400px', margin: '2rem auto' }} onSubmit={handleSubmit}>
        <h1 className="title">Sign In</h1>

        {error && <p className="help is-danger">{error}</p>}

        <div className="field">
          <input
            className="input"
            name="username"
            placeholder="Username or email"
            type="text"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
        </div>

        <div className="field">
          <input
            className="input" name="password" placeholder="Password" type="password"
            value={form.password} onChange={handleChange} required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="button is-primary is-fullwidth">Sign In</button>

        <p className="has-text-centered" style={{ marginTop: '1rem' }}>
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  )
}

export default SignIn
