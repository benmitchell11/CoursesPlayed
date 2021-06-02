import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function UserDropDown() {
  const [isActive, setActive] = useState(false)

  const handleToggle = () => {
    switch (isActive) {
      case false: setActive(true)
        break
      case true: setActive(false)
        break
    }
  }
  // useEffect(() => {
  //   getItemCategory()
  //     .then((res) => {
  //       return setItems(res)
  //     })
  //     .catch((error) => {
  //       console.log('error: ', error.message)
  //     })
  // }, [])

  return (
    <div >
      <div className={isActive ? 'dropdown is-active' : 'dropdown'}>
        <div className="dropdown-trigger">
          <img onClick={handleToggle} className="userDropDown" aria-haspopup="true" aria-controls="dropdown-menu3" src='./img/profile.jpg' />
        </div>
        <div className="dropdown-menu" id="dropdown-menu3" role="menu">
          <div className="dropdown-content">

            <Link to='/userprofile/2' className='dropdown-item'>
                My Profile
            </Link>

            <Link to='/' className='dropdown-item'>
                My Courses
            </Link>

            <Link to='/' className='dropdown-item'>
                Sign Out
            </Link>

          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDropDown