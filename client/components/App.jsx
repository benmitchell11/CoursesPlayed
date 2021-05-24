import React from 'react'
import { Link } from 'react-router-dom'

import Home from './Home'
import Register from './Register'
import SignIn from './SignIn'

import { Route } from 'react-router-dom'

function App () {
  return (
    <>
    
    <Route exact path='/' component={Home} />
    <Route exact path='/register' component={Register} />
    <Route exact path='/signin' component={SignIn} />
    </>
    
  )
}

export default App
