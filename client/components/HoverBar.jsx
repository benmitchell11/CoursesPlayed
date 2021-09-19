import React from 'react'
import SearchBar from './SearchBar'
import UserDropDown from './UserDropDown'

function HoverBar () {
    return (
        <div className='testNav'>
            <div className='box'></div>
            <div className='hoverbar-logo'>
            <img className='testLogo' src='./img/newlogo3.png'  />
            
            </div>

            <div className='courses-button'>
            <a href='/#/courses'>
                <img className='top' src='./img/coursesbutton.png' />
                <img className='bottom' src='./img/coursesbuttonback.png' />
                </a>
            </div>

            <div className='signin-button'>
            <a href='/#/signin'>
                <img className='top' src='./img/SignInTop.png' />
                <img className='bottom' src='./img/SignInBottom.png' />
                </a>
            </div>

            <div className='register-button'>
            <a href='/#/register'>
                <img className='top' src='./img/RegisterTop.png' />
                <img className='bottom' src='./img/RegisterBottom.png' />
                </a>
            </div>

            <div className='profile-button'>
            <a href='/#/userprofile/2'>
                <img className='top' src='./img/ProfileTop.png' />
                <img className='bottom' src='./img/ProfileBottom.png' />
                </a>
            </div>
            
            
            

        </div>
    )
}

export default HoverBar