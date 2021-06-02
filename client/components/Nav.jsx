import React from 'react'
import { Link } from 'react-router-dom'
import { IfAuthenticated, IfNotAuthenticated } from './Authenticated'
import SearchBar from './SearchBar'
import UserDropDown from './UserDropDown'


function Nav() {
    return (
        <div className='alingElementNav'>
            <a href='/'>
            <img className='nav-logo' src='./img/logo.png' />
            </a>
            <div className='alingSearchBar'>
                <SearchBar />
            </div>
            
            <div className='RegisterButton'>

    <Link className="button primaryBtn" to='/register'>Register</Link>

    </div>
    <div className='SignInButton'>
    
    <Link className="button primaryBtn" to='/signin'>Sign In</Link>

    </div>


    <UserDropDown />
        </div>

        
    )
}

export default Nav