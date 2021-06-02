import React from 'react'
import { Link } from 'react-router-dom'


const LandingPage = () => {
    return (
    <div className='landing-background'>
        <div className='landingLogo'>
        <img className='landing-logo' src='./img/logo.png'/>
        </div>
        <div className='landing-text'>
        <h1>An easy way to keep track of all the golf courses you have played.</h1>
        </div>
    </div>
       
    )
}

export default LandingPage