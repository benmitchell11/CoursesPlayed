import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUser } from '../apiClient'
import Nav from './Nav'
import EditPopup from './EditPopup'

export default function UserProfile (props) {

    const [isOpen, setIsOpen] = useState(false)

    const togglePopup = () => {
        setIsOpen(!isOpen)
    }

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

    return (
        <div className='globalBackground'>
            <Nav />
            <div className='UserInfoForm'>
                <h1>General User Information</h1>
                <h2>Profile Picture</h2>
                <img src={user.profilePic} style={{ width: '300px', height: '300px' }}
                alt=''
              />
              <div className='UsernameEdit'>
              <h2>Username</h2>
              <p>{user.username}</p>
              <input type='button' value='Edit' onClick={togglePopup} />
              {isOpen && <EditPopup
                content={<>
                <b>Edit Your Username</b>
                <div className='userNameEditInput'>
                 <input className='usernameEdit' placeholder={user.username} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        handleClose={togglePopup}
                        />}
              <div />
              <div className='EmailEdit'>
              <h2>Email</h2>
              <p>{user.email}</p>
              <input type='button' value='Edit' onClick={togglePopup} />
              {isOpen && <EditPopup
                content={<>
                <b>Edit Your Email</b>
                <div className='emailEditInput'>
                 <input className='emailEdit' placeholder={user.email} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        handleClose={togglePopup}
                        />}
              </div>
              <div className='CountryEdit'>
              <h2>Country</h2>
              <p>{user.country}</p>
              <input type='button' value='Edit' onClick={togglePopup} />
              {isOpen && <EditPopup
                content={<>
                <b>Edit Your Country</b>
                <div className='countryEditInput'>
                 <input className='countryEdit' placeholder={user.country} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        handleClose={togglePopup}
                        />}
              </div>
              <div className='RegionEdit'>
              <h2>Region</h2>
              <p>{user.region}</p>
              <input type='button' value='Edit' onClick={togglePopup} />
              {isOpen && <EditPopup
                content={<>
                <b>Edit Your Region</b>
                <div className='regionEditInput'>
                 <input className='regionEdit' placeholder={user.email} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        handleClose={togglePopup}
                        />}
              </div>
              <div className='HandicapEdit'>
              <h2>Handicap</h2>
              <p>{user.handicap}</p>
              <input type='button' value='Edit' onClick={togglePopup} />
              {isOpen && <EditPopup
                content={<>
                <b>Edit Your Handicap</b>
                <div className='handicapEditInput'>
                 <input className='handicapEdit' placeholder={user.handicap} />
                 </div>
                    <button>Save Changes</button>
                    </>}
                        handleClose={togglePopup}
                        />}
              </div>
              </div>
            </div>
        </div>
    )
}