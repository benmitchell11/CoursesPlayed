import React from 'react'
import { Link } from 'react-router-dom'
import { Route } from 'react-router-dom'


import Home from './Home'
import Register from './Register'
import SignIn from './SignIn'
import LandingPage from './LandingPage'
import UserProfile from './UserProfile'
import Courses from './Courses'


function App () {
  return (
    <>
    
    <Route exact path='/' component={Home} />
    <Route exact path='/register' component={Register} />
    <Route exact path='/signin' component={SignIn} />
    <Route exact path='/landing' component={LandingPage} />
    <Route exact path='/userprofile/:id' component={UserProfile} />
    <Route exact path='/courses' component={Courses} />
    </>
    
  )
}

export default App
