import React, { useState, useContext } from 'react'
import { isAuthenticated, signIn } from 'authenticare/client'
import { Link } from 'react-router-dom'

import { UserContext, updateUserContext } from './UserContext'

function SignIn (props) {
  const [, setUser] = useContext(UserContext)
  const [form, setForm] = useState({
    username: '',
    password: ''
  })

  const baseUrl = '/api/v1'
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
  }

  const handleClick = () => {
    const { username, password } = form
    return signIn({ username, password }, { baseUrl })
      .then(() => {
        if (isAuthenticated()) {
          updateUserContext(setUser)
          return props.history.push('/Home')
        }
        return null
      })
  }

  return (

    <div className="form">
      <div className='formLeft'>
      </div>
      <div className="formRight">
        <div className="signInTitle">
          <h1>Sign in</h1>
        </div>
        <input className="formInput" placeholder="Username" id="username" name="username" value={form.username} onChange={handleChange} type="text"/>
        <input className="formInput" placeholder="Password" id="password" name="password" value={form.password} onChange={handleChange} type="password"/>

        <button className="button primaryBtn" data-testid="submit-button" onClick={handleClick}>Sign in</button>
      </div>
    </div>

  )
}
export default SignIn
