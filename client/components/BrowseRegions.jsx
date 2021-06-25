import React, { useState, useEffect } from 'react'
import { getRegions } from '../apiClient'
import SingleRegion from './SingleRegion'

export default function BrowseRegions() {
    const [regions, setRegions] = useState({
        regions: []
    })

    useEffect(() => {
        getRegions()
        .then((res) => {
            return setRegions(res)
        })
        .catch((error) => {
            console.log('error', error.message)
            console.log(regions)
        })
    }, [])

    return (
        <div>
            <ul>
                {regions.regions.map((region) => {
                    return <li className='regionlist' key={region.id}>
                        <SingleRegion region={region} />
                    </li>
                })}
            </ul>
        </div>
    )
}