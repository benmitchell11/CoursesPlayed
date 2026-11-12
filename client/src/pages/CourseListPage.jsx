import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { searchCourses } from '../apiClient'
import { foldText } from '../lib/text'
import '../styles/CourseListPage.css'

function CourseListPage () {
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    searchCourses()
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredCourses = useMemo(() => {
    const query = foldText(search)
    if (!query) return courses

    return courses.filter((course) => (
      foldText(course.name).includes(query) ||
      foldText(course.city).includes(query)
    ))
  }, [courses, search])

  return (
    <main className="course-list-page">
      <div className="container">
        <div className="course-list-heading">
          <div>
            <p className="course-list-eyebrow">New Zealand golf</p>
            <h1 className="title">Courses</h1>
            <p>Browse every course in the directory and open one to see its details.</p>
          </div>

          <div className="course-list-search">
            <label htmlFor="course-list-search">Find a course</label>
            <input
              id="course-list-search"
              className="input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or town"
            />
          </div>
        </div>

        {error && <p className="notification is-danger">{error}</p>}
        {loading && <p>Loading courses…</p>}

        {!loading && !error && (
          <>
            <p className="course-list-count" aria-live="polite">
              {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'}
            </p>

            {filteredCourses.length > 0
              ? (
                <ul className="course-list-grid">
                  {filteredCourses.map((course) => (
                    <li key={course.id}>
                      <Link className="course-list-card" to={`/courses/${course.id}`}>
                        <span className="course-list-card-name">{course.name}</span>
                        <span className="course-list-card-location">
                          {course.city}, {course.country}
                        </span>
                        <span className="course-list-card-action">View course →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                )
              : <p className="course-list-empty">No courses match “{search}”.</p>}
          </>
        )}
      </div>
    </main>
  )
}

export default CourseListPage
