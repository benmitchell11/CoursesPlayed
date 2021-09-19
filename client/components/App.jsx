import React from 'react'
import { Link } from 'react-router-dom'
import { Route } from 'react-router-dom'


import Home from './Home'
import Register from './Register'
import SignIn from './SignIn'
import LandingPage from './LandingPage'
import UserProfile from './UserProfile'
import Region from './Region'
import TestingPage from './TestingPage'
import Courses from './Courses'
import ByRegion from './ByRegion'
import BrowseRegions from './BrowseRegions'
import RegionCourses from './RegionCourses'
import CoursesByRegion from './CoursesByRegion'
import RegionName from './RegionName'
import TestingRegion from './TestingRegion'


function App () {
  return (
    <>
    
    <Route exact path='/' component={Home} />
    <Route exact path='/register' component={Register} />
    <Route exact path='/signin' component={SignIn} />
    <Route exact path='/landing' component={LandingPage} />
    <Route exact path='/userprofile/:id' component={UserProfile} />
    <Route exact path='/region' component={Region} />
    <Route exact path='/test' component={TestingPage} />
    <Route exact path='/courses' component={Courses} />
    {/* <Route exact path='/regioncourses/:id' component={ByRegion} /> */}
    <Route exact path='/browseregions' component={BrowseRegions} />
    <Route exact path='/coursestest/region_id' component={RegionCourses} />
    <Route path='/regioncourses/:id' component={CoursesByRegion} />
    {/* <Route exact path='/regioncourses/:name' component={RegionName} /> */}
    <Route exact path='/testingregion/:regionNumber' component={TestingRegion} />
    <Route path='/testingregion/:id' component={TestingRegion} />
    
    </>
    
  )
}

export default App
