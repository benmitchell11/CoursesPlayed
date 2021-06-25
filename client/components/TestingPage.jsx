import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRegion } from '../apiClient'
import Nav from './Nav'
import EditPopup from './EditPopup'

export default function TestingPage (props) {

    

  

    

    const [region, setRegion] = useState({
        user: []
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
        <div className='globalBackground'>
            <Nav />
            <div className='UserInfoForm'>
                <div className='profile-heading' >
                <h1>General User Information</h1>
                </div>
                <div className='profile-Pic' >
                    <div className='profile-pic-heading'>
                <h2>Profile Picture</h2>
                </div>
              </div>
              </div>
              <div className='UsernameEdit'>
              <h2>Username</h2>
              <p>{region.name}</p>
              <EditPopup
                content={<>
                <b>Edit Your Username</b>
                <div className='userNameEditInput'>
                 <input className='usernameEdit' placeholder={region.name} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        />
              <div />
              <div className='EmailEdit'>
              <h2>Email</h2>
              <p>{region.island}</p>
              <EditPopup
                content={<>
                <b>Edit Your Email</b>
                <div className='emailEditInput'>
                 <input className='emailEdit' placeholder={region.name} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        />
              </div>
              
              
            
            </div>
        </div>
    )
}
