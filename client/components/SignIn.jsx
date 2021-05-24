import React, { useState, useContext } from 'react'
import { isAuthenticated, signIn } from 'authenticare/client'
import { Link } from 'react-router-dom'

function SignIn () {
    
    return (
        <div className="form">
            <h1>
                Sign In
            </h1>

            <input className="formInput" placeholder="Username" type="username"></input>
            <input className="formInput" placeholder="Password" type="password"></input>

            <button type="button" className="button primaryBtn">Register</button>


        </div>
    )
}

export default SignIn