import React, { useState, useContext } from 'react'
import { register, isAuthenticated } from 'authenticare/client'
import { Link } from 'react-router-dom'

import { UserContext, updateUserContext } from './UserContext'




function Register () {
    

    return (
        <div className="form" >
            
            <h1>Register</h1>

            <input className="formInput" placeholder="Email" type="email" ></input>

            <input className="formInput" placeholder="Username" type="username"></input>

            <input className="formInput" placeholder="Password" type="Password"></input>

            <button type="button" className="button primaryBtn">Register</button>

        </div>
    )


}

export default Register