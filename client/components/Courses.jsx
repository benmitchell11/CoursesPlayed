import React, { useState, useEffect } from 'react'
import { getCourses } from '../apiClient'
import Nav from './Nav'

export default function Courses() {
    return(
        <div className='globalBackground' >
            <Nav />
            <div className='NorthIsland'>
                <a href='/'>
                <img className='north-island' src='./img/NorthIsland.png' />
                </a>
            </div>
            <div className='SouthIsland'>
                <a href='/'>
                <img className='south-island' src='./img/SouthIsland.png' />
                </a>
            </div>
        </div>
    )
}
