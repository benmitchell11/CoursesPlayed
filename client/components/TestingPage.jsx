import React, { useState, useEffect } from 'react'
import { getCourses } from '../apiClient'
import Nav from './Nav'
import MapCopy from './MapCopy'

export default function Courses() {
    return(
        <div className='globalBackground' >
            <Nav />
            <div className='Region-Header'>
            <h2>Select a Region</h2>
            </div>
            <MapCopy />
            
        </div>
    )
}
