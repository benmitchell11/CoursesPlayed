import React from 'react'
import {Link} from 'react-router-dom'
import SearchBar from './SearchBar'



const Home = () => {
    return (
        <>
    <div className='globalBackground'>

        <div className='Search'>
            <SearchBar />
        </div>

    <div className='Title'>    
        
    <h1>
        Course I've Played
    </h1>

    </div>

    <div className='RegisterButton'>

    <Link className="button primaryBtn" to='/register'>Register</Link>

    </div>

    <div className='SignInButton'>
    
    <Link className="button primaryBtn" to='/signin'>Sign In</Link>

    </div>

    </div>
    </>
    
    )

}

export default Home 