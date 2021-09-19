import React, { useState, useEffect } from 'react'
import Nav from './Nav'
import Course from './Course'
import BrowseCourses from './BrowseCourses'
import getCoursesByRegion from '../apiClient'
import BrowseRegions from './BrowseRegions'


function Courses() {

    const result = 4/40*100
    
    console.log(result)

    return (
        <div className='globalBackground'>
            <Nav />
            <BrowseCourses />
        </div>
    )
}

export default Courses
