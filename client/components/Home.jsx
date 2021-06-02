import React from 'react'
import {Link} from 'react-router-dom'
import SearchBar from './SearchBar'
import Nav from './Nav'



const Home = () => {
    return (
        

       
                
    <div className='globalBackground'>

    <Nav />
      

       

    <Link className="button primaryBtn" to='/landing'>Landing</Link>
    <Link className="button primaryBtn" to='/courses'>courses</Link>



    </div>
    
    
    )

}

export default Home 