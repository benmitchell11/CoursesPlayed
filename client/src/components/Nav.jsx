import React, { useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { UserContext } from '../context/UserContext'
import { signOut } from '../apiClient'
import logo from '../assets/logo.png'
import golfClub from '../assets/golf_club_icon_125737.png'
import '../styles/Nav.css'

function NavHoverClub () {
  return <img className="nav-hover-club" src={golfClub} alt="" aria-hidden="true" />
}

function Nav () {
  const { user, setUser, loading } = useContext(UserContext)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    navigate('/')
  }

  const isCurrentPath = (path) => location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(`${path}/`))

  return (
    <nav
      className="navbar site-nav"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand">
        <Link className="navbar-item navbar-logo-link" to="/" aria-label="Courses Played home">
          <img src={logo} alt="Courses Played" className="nav-logo" />
        </Link>
      </div>

      <div className="site-nav-links">
        <Link
          className={`navbar-item${isCurrentPath('/map') ? ' is-current' : ''}`}
          to="/map"
          aria-current={isCurrentPath('/map') ? 'page' : undefined}
        >
          Map
          <NavHoverClub />
        </Link>

        <Link
          className={`navbar-item${isCurrentPath('/courses') ? ' is-current' : ''}`}
          to="/courses"
          aria-current={isCurrentPath('/courses') ? 'page' : undefined}
        >
          Courses
          <NavHoverClub />
        </Link>

        {!loading && user && (
          <Link
            className={`navbar-item${isCurrentPath('/golfers') ? ' is-current' : ''}`}
            to="/golfers"
            aria-current={isCurrentPath('/golfers') ? 'page' : undefined}
          >
            Golfers
            <NavHoverClub />
          </Link>
        )}

        {!loading && user && (
          <Link
            className={`navbar-item${isCurrentPath('/log') ? ' is-current' : ''}`}
            to="/log"
            aria-current={isCurrentPath('/log') ? 'page' : undefined}
          >
            Log round
            <NavHoverClub />
          </Link>
        )}

        {!loading && user && (
          <Link
            className={`navbar-item${isCurrentPath('/profile') ? ' is-current' : ''}`}
            to="/profile"
            aria-current={isCurrentPath('/profile') ? 'page' : undefined}
          >
            Profile
            <NavHoverClub />
          </Link>
        )}

        {!loading && (
          user ? (
            <button type="button" className="navbar-item nav-account-button" onClick={handleSignOut}>
              Log out
              <NavHoverClub />
            </button>
          ) : (
            <Link className="navbar-item nav-account-button" to="/signin">
              Sign in
              <NavHoverClub />
            </Link>
          )
        )}
      </div>
    </nav>
  )
}

export default Nav
