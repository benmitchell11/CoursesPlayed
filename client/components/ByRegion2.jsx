import React, { useState, useEffect } from 'react'
import { getRegion } from '../apiClient'
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

    console.log(props)

    return (
        <div className='globalbackground'>
            <Nav />
            <div className='coursedisplay'>
                <p>{region.name}</p>
            </div>
        </div>
    )
}
