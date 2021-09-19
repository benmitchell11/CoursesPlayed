import React, { useState, useEffect } from 'react'
import { getCourses} from '../apiClient'
import Course from './Course'


export default function BrowseCourses() {
    const [courses, setCourses] = useState({
        courses: []
    })

   useEffect(() =>{
        getCourses()
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