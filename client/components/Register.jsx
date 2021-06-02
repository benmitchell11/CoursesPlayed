import React, { useState, useContext } from 'react'
import { register, isAuthenticated } from 'authenticare/client'
import { Link } from 'react-router-dom'

import { UserContext, updateUserContext } from './UserContext'
import Nav from './Nav'

function Register (props) {
  const [, setUser] = useContext(UserContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const baseUrl = '/api/v1'

  const handleClick = () => {
    register(
      {
        username: username,
        password: password,
        email: email
      },
      { baseUrl }
    )
      .then(() => {
        if (isAuthenticated()) {
          updateUserContext(setUser)
          return props.history.push('/Home')
        }
        return null
      })
      .catch((error) => {
        console.log('error: ', error.message)
      })
  }

  return (
    <>

    <Nav />

    <div className="form" >
      <div className='formLeft'>
      </div>
      <div className="formRight">

        <h1>Register</h1>

        <input className="formInput" placeholder="Email" type="email" onChange={(e) => setEmail(e.target.value)}></input>

        <input className="formInput" placeholder="Username" type="username" value={username} onChange={(e) => setUsername(e.target.value)}></input>

        <input className="formInput" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}></input>

        <button type="button" className="button primaryBtn" onClick={handleClick} data-testid="submitButton">Register</button>

       
      </div>
    </div>
    </>
  )
}

export default Register
