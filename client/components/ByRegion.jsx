import React, { useState, useEffect } from 'react'
import { getRegion, getCoursesByRegion, getCoursesByRegionID } from '../apiClient'
import BrowseCourses from './BrowseCourses'
import Nav from './Nav'

export default function ByRegion (props) {
    console.log(props)
    const [region, setRegion] = useState({
        region: []
    })
    useEffect(() => {
        getRegion(props.match.params.id)
        .then((res) => {
            setRegion(res)
        })
        .catch((error) => {
            console.log('error', error.message)
        })
    }, [])

    const regionName = String(region.name)

    

    const [courses, setCourses] = useState({
        courses: []
    })

   
    useEffect(() => {
        getCoursesByRegionID(props.match.params.region_id)
        .then((res) => {
            setCourses(res)
        })
        .catch((error) => {
            console.log('error', error.message)
        })
    }, [])

    console.log(courses)

    return (
        <div className='globalbackground'>
            <Nav />
            <div className='coursedisplay'>
                
                <h1>{region.name}</h1>
            </div>
            <div>
                
            </div>
        </div>
    )
}
