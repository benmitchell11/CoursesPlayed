import React, { useState, useEffect } from 'react'
import { getCoursesByRegionID } from '../apiClient'
import Course from './Course'

export default function RegionCourses (props) {
    const [courses, setCourses] = useState({
        courses: []
    })

    useEffect(() =>{
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
       
        <div>
            <h1>this is a test</h1>
        <ul className='imageGridContainer'>
            {courses.courses.map((course) => {
                return <li className='imagegriditem' key={course.id}>
                    <Course course={course} />
                </li>
            })}
        </ul>
        </div>
        
    )
}
