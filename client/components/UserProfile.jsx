import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUser } from '../apiClient'
import Nav from './Nav'
import EditPopup from './EditPopup'

export default function UserProfile (props) {

    

  

    

    const [user, setUser] = useState({
        user: []
    })
    useEffect(() => {
        getUser(props.match.params.id)
            .then((res) => {
                setUser(res)
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
                <div className='profile-pic-display'>
                <img src={user.profilePic} style={{ width: '150px', height: '150px' }}
                alt=''
              />
              </div>
              </div>
              <div className='UsernameEdit'>
              <h2>Username</h2>
              <p>{user.username}</p>
              <EditPopup
                content={<>
                <b>Edit Your Username</b>
                <div className='userNameEditInput'>
                 <input className='usernameEdit' placeholder={user.username} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        />
              <div />
              <div className='EmailEdit'>
              <h2>Email</h2>
              <p>{user.email}</p>
              <EditPopup
                content={<>
                <b>Edit Your Email</b>
                <div className='emailEditInput'>
                 <input className='emailEdit' placeholder={user.email} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        />
              </div>
              <div className='CountryEdit'>
              <h2>Country</h2>
              <p>{user.country}</p>
                <EditPopup
                content={<>
                <b>Edit Your Country</b>
                <div className='countryEditInput'>
                 <input className='countryEdit' placeholder={user.country} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        />
              </div>
              <div className='RegionEdit'>
              <h2>Region</h2>
              <p>{user.region}</p>
                <EditPopup
                content={<>
                <b>Edit Your Region</b>
                <div className='regionEditInput'>
                 <input className='regionEdit' placeholder={user.region} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        
                        />
              </div>
              <div className='HandicapEdit'>
              <h2>Handicap</h2>
              <p>{user.handicap}</p>
                <EditPopup
                content={<>
                <b>Edit Your Handicap</b>
                <div className='handicapEditInput'>
                 <input className='handicapEdit' placeholder={user.handicap} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        />
              </div>
              </div>
            </div>
        </div>
    )
}