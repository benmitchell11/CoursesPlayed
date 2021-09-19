import React, { useState, useEffect } from 'react'
import Nav from './Nav'
import Course from './Course'
import { getCoursesByRegionID, getRegion } from '../apiClient'
import Courses from './Region'

function TestingRegion (props) {

    // const [region, setRegion] = useState ({
    //     region: []
    // })
    // useEffect(() => {
    //     getRegion(props.match.params.id)
    //     .then((res) => {
    //         setRegion(res)
    //     })
    //     .catch((error) => {
    //         console.log('error', error.message)
    //     })
    // }, [])


    console.log(props)
    const [courses, setCourses] = useState([])
    useEffect(() => {
        getCoursesByRegionID(props.match.params.regionNumber)
    .then((res) => {
        return setCourses(res)
        
    })
    .catch((error) => {
        console.log('error', error.message)
    })

}, [props.match.params])

  

    console.log(region)



return (
    
    <div className='globalBackground'>
        <Nav />
        
        
       
        <ul className='imageGridContainer'>
            {courses.map((course) => {
                return <li className='imageGridItem' key={course.id}>
                    <Course course={course} />
                </li>
            })}
        </ul>
    </div>
)
}

export default TestingRegion