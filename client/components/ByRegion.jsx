import React, { useState, useEffect } from 'react'
import { getRegion, getCoursesByRegion, getCoursesByRegionNumber } from '../apiClient'
import BrowseCourses from './BrowseCourses'
import Nav from './Nav'
import Course from './Course'
import TestingRegion from './TestingRegion'

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

    

    console.log('Region' + region)

    // const [courses, setCourses] = useState({
    //     courses: []
    // })

   
    // useEffect(() => {
    //     getCoursesByRegionNumber(props.match.params.regionNumber)
    //     .then((res) => {
    //         setCourses(res)
    //     })
    //     .catch((error) => {
    //         console.log('error', error.message)
    //     })
    // }, [])

    // console.log(courses)

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
