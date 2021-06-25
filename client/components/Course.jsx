import React from 'react'
import { Link } from 'react-router-dom'

export default function Course({ course }) {
    const courseID = String(course.id)
    const courseName = String(course.name)

    return (
        <div className='course-card'>
            <div className='course-tumb'>
            <Link to={`/CourseDetails/${courseName}`}>
                <img src={course.photo} style={{ width: '250px', height: '250px'}} />
                </Link>
            </div>
            <div className='course-details'>
                <div className='course-bottom-details'>
                <Link to={`/CourseDetails/${course}`}>
                    <h1 className=''>{course.name}</h1>
                    </Link>
                </div>
            </div>
        </div>
    )
}