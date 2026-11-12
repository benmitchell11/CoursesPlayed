import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { UserContext } from '../context/UserContext'
import logo from '../assets/logo.png'
import slideFairway from '../assets/home/course.jpg'
import slideGreen from '../assets/home/green.jpg'
import slideBunker from '../assets/home/bunker.jpg'
import '../styles/Home.css'

const COURSE_SLIDES = [
  {
    image: slideFairway,
    location: 'Fairway morning light'
  },
  {
    image: slideGreen,
    location: 'On the green'
  },
  {
    image: slideBunker,
    location: 'Around the bunkers'
  }
]

function Home () {
  const { user } = useContext(UserContext)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % COURSE_SLIDES.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-slides" aria-hidden="true">
          {COURSE_SLIDES.map((slide, index) => (
            <div
              key={slide.image}
              className={`home-slide${index === activeSlide ? ' is-active' : ''}`}
              style={{ backgroundImage: `url("${slide.image}")` }}
            />
          ))}
        </div>
        <div className="home-shade" />

        <div className="home-content">
          <img className="home-logo" src={logo} alt="Courses Played" />
          <p className="home-eyebrow">Your golfing story, all in one place</p>
          <h1>Every course leaves a mark.</h1>
          <p className="home-intro">
            Remember the courses you have played, discover where to tee off next,
            and share the journey with golfers across New Zealand.
          </p>

          <div className="home-actions">
            {user ? (
              <Link className="button is-primary is-medium" to="/courses">Explore courses</Link>
            ) : (
              <>
                <Link className="button is-primary is-medium" to="/register">Get started</Link>
                <Link className="button is-light is-medium" to="/signin">Sign in</Link>
              </>
            )}
          </div>
        </div>

        <div className="home-slide-controls" aria-label="Choose featured image">
          {COURSE_SLIDES.map((slide, index) => (
            <button
              key={slide.location}
              type="button"
              className={index === activeSlide ? 'is-active' : ''}
              aria-label={`Show slide ${index + 1}: ${slide.location}`}
              aria-current={index === activeSlide ? 'true' : undefined}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>

        <p className="home-slide-caption">{COURSE_SLIDES[activeSlide].location}</p>
      </section>

      <section className="home-mission">
        <p className="home-section-label">Our mission</p>
        <h2>Make every round part of a bigger journey.</h2>
        <p>
          Courses Played exists to help golfers keep a personal record of the
          places they have played, find honest recommendations, and build a
          community around the courses that make the game memorable.
        </p>
      </section>

      <section className="home-features">
        <div className="home-features-heading">
          <p className="home-section-label">Made for golfers</p>
          <h2>More than a list of courses.</h2>
          <p>
            Build a record of your golf, stay connected with the people you play
            alongside, and discover where the next round could take you.
          </p>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-card">
            <span className="home-feature-number">01</span>
            <h3>Remember every round</h3>
            <p>
              Keep track of the courses you have played, when you played them,
              and the moments worth remembering.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="home-feature-number">02</span>
            <h3>See where your friends have played</h3>
            <p>
              Explore your friends&apos; course history, compare experiences,
              and find inspiration for your next group round.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="home-feature-number">03</span>
            <h3>Discover somewhere new</h3>
            <p>
              Search courses and explore New Zealand on the interactive map to
              find a new fairway close to home or further afield.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="home-feature-number">04</span>
            <h3>Share local knowledge</h3>
            <p>
              Swap recommendations, course tips, and memorable stories with a
              community that understands the game.
            </p>
          </article>
        </div>
      </section>

      <section className="home-community">
        <div>
          <p className="home-section-label">The next tee is waiting</p>
          <h2>Where will you play next?</h2>
          <p>
            Browse courses across New Zealand and start building a golfing
            history that is uniquely yours.
          </p>
        </div>
        <Link className="button is-light is-medium" to={user ? '/courses' : '/register'}>
          {user ? 'Browse courses' : 'Join Courses Played'}
        </Link>
      </section>
    </main>
  )
}

export default Home
