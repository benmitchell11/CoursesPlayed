import React, { useState, useContext } from 'react'
import { register, isAuthenticated } from 'authenticare/client'
import { Link } from 'react-router-dom'

import { UserContext, updateUserContext } from './UserContext'

function Register (props) {
    const [user, setUser] = useContext(UserContext)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const baseUrl = '/api/v1'

    const handleClick 

}