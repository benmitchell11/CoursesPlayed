import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react'

import { searchCourses, createCourse, getMyPlayedCourses } from '../apiClient'
import { UserContext } from '../context/UserContext'
import { foldText } from '../lib/text'
import CoursesMap from '../components/CoursesMap'
import AddCourseForm from '../components/AddCourseForm'
import CourseFilters from '../components/CourseFilters'
import '../styles/CoursesPage.css'

function CoursesPage () {
  const { user } = useContext(UserContext) || {}
  const [courses, setCourses] = useState([])
  const [error, setError] = useState(null)
  const [addingCourse, setAddingCourse] = useState(false)
  const [pendingLocation, setPendingLocation] = useState(null)
  const [search, setSearch] = useState('')
  const [pinFilter, setPinFilter] = useState('all')
  const [selectedRegions, setSelectedRegions] = useState([])
  const [playedEntries, setPlayedEntries] = useState([])

  const loadCourses = useCallback(() => {
    searchCourses().then(setCourses).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (!user) {
      setPlayedEntries([])
      setPinFilter('all')
      return
    }

    getMyPlayedCourses()
      .then(setPlayedEntries)
      .catch((err) => setError(err.message))
  }, [user])

  const playedCourseIds = useMemo(
    () => new Set(playedEntries.map((entry) => Number(entry.course_id))),
    [playedEntries]
  )

  const filteredCourses = useMemo(() => {
    const normalisedSearch = foldText(search)

    return courses.filter((course) => {
      const matchesSearch = !normalisedSearch ||
        foldText(course.name).includes(normalisedSearch) ||
        foldText(course.city).includes(normalisedSearch)
      const isPlayed = playedCourseIds.has(Number(course.id))
      const matchesPlayedStatus =
        pinFilter === 'all' ||
        (pinFilter === 'played' && isPlayed) ||
        (pinFilter === 'unplayed' && !isPlayed)

      return matchesSearch && matchesPlayedStatus
    })
  }, [courses, pinFilter, playedCourseIds, search])

  const toggleRegion = (regionId) => {
    setSelectedRegions((current) => (
      current.includes(regionId)
        ? current.filter((id) => id !== regionId)
        : [...current, regionId]
    ))
  }

  const handleAddCourse = async (course) => {
    const created = await createCourse(course)
    setCourses((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
    setAddingCourse(false)
    setPendingLocation(null)
  }

  return (
    <main className="courses-page">
      <div className="container">
        <h1 className="title">Map</h1>

        {error && <p className="help is-danger">{error}</p>}

        <div className="courses-layout">
          <div className="courses-sidebar">
            <CourseFilters
              user={user}
              search={search}
              onSearchChange={setSearch}
              pinFilter={pinFilter}
              onPinFilterChange={setPinFilter}
              selectedRegions={selectedRegions}
              onRegionToggle={toggleRegion}
              onClearRegions={() => setSelectedRegions([])}
            />
            {addingCourse && (
              <AddCourseForm
                pendingLocation={pendingLocation}
                onSubmit={handleAddCourse}
                onCancel={() => { setAddingCourse(false); setPendingLocation(null) }}
              />
            )}
          </div>
          <div className="courses-map-column">
            <CoursesMap
              courses={filteredCourses}
              playedCourseIds={playedCourseIds}
              regionFilters={selectedRegions}
              onMapClick={addingCourse ? setPendingLocation : null}
              pendingLocation={pendingLocation}
            />
          </div>
        </div>

        <p className="has-text-centered is-size-7 mt-3 mb-5">
          Course location data ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap contributors
          </a>
        </p>
      </div>
    </main>
  )
}

export default CoursesPage
