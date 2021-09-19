import React, { useState, useEffect } from 'react'
import Course from './Course'
import Nav from './Nav'
import { getCoursesByRegionID, getRegion } from '../apiClient'



function CoursesByRegion (props) {
    
    const [region, setRegion] = useState ({
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

    console.log(region.name)

    const regionID = region.regionID

    console.log(regionID)

    const [courses, setCourses] = useState([])
    useEffect(() => {
        getCoursesByRegionID(regionID)
    .then((res) => {
        return setCourses(res)
        
    })
    .catch((error) => {
        console.log('error', error.message)
    })

}, [regionID])


    return (
        <div className='globalBackground'>
            <Nav />
            <h1>{region.name}</h1>
            <div className='coursedisplay'>
            <ul className='imageGridContainer'>
            {courses.map((course) => {
                return <li className='imageGridItem' key={course.id}>
                    <Course course={course} />
                </li>
            })}
        </ul>
                
            </div>
        </div>
    )

}

export default CoursesByRegion