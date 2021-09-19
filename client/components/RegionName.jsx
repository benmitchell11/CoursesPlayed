import React, { useState, useEffect } from 'react'
import { getRegionByName, getCoursesByRegion, getCoursesByRegionID } from '../apiClient'
import BrowseCourses from './BrowseCourses'
import Nav from './Nav'

export default function RegionName (props) {
    console.log(props)
    const [region, setRegion] = useState({
        region: []
    })
    useEffect(() => {
        getRegionByName(props.match.params.name)
        .then((res) => {
            setRegion(res)
        })
        .catch((error) => {
            console.log('error', error.message)
        })
    }, [])

    

    

  

    

    return (
        <div className='globalbackground'>
            <Nav />
            
            <div className='coursedisplay'>
                
                <h2>{region.name}</h2>
            </div>
            <div>
                
            </div>
        </div>
    )
}
