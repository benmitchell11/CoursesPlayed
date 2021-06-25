import React from 'react'
import { Link } from  'react-router-dom'

export default function SingleRegion( {region }) {
    const regionID = String(region.id)

    return (
        <div className='region-card'>
            <h1>{region.name}</h1>
        </div>
    )
}