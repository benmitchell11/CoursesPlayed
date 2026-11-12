import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import NzOutline from './NzOutline'
import { project, unproject, MAP_WIDTH, MAP_HEIGHT } from '../nzProjection'
import { NZ_INTERNAL_BORDERS_PATH } from '../nzBorders'
import '../styles/CoursesMap.css'

const PIN_RADIUS = 7
const PENDING_RADIUS = 13
const FULL_VIEW_BOX = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT }

// Only drop courses that project completely off the artwork (e.g. Chatham Islands).
const MAP_EDGE_MARGIN = 20

// Regional SVG shapes cut off beaches and the Northland/Auckland join. Expand
// each region's box so coastal clubs like Waipu and Mangawhai still match.
const REGION_BOX_PAD_X = 24
const REGION_BOX_PAD_Y = 40

function viewBoxForRegion (path) {
  if (!path || typeof path.getBBox !== 'function') return FULL_VIEW_BOX

  const bounds = path.getBBox()
  const padding = Math.max(bounds.width, bounds.height) * 0.18
  const centreX = bounds.x + (bounds.width / 2)
  const centreY = bounds.y + (bounds.height / 2)
  const mapAspect = MAP_WIDTH / MAP_HEIGHT
  let width = bounds.width + (padding * 2)
  let height = bounds.height + (padding * 2)

  if (width / height > mapAspect) {
    height = width / mapAspect
  } else {
    width = height * mapAspect
  }

  width = Math.min(width, MAP_WIDTH)
  height = Math.min(height, MAP_HEIGHT)

  return {
    x: Math.max(0, Math.min(centreX - (width / 2), MAP_WIDTH - width)),
    y: Math.max(0, Math.min(centreY - (height / 2), MAP_HEIGHT - height)),
    width,
    height
  }
}

function screenToSvgPoint (svg, clientX, clientY) {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(ctm.inverse())
}

function isOnMap (x, y) {
  return (
    x >= -MAP_EDGE_MARGIN &&
    x <= MAP_WIDTH + MAP_EDGE_MARGIN &&
    y >= -MAP_EDGE_MARGIN &&
    y <= MAP_HEIGHT + MAP_EDGE_MARGIN
  )
}

function pointInBox (x, y, box) {
  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  )
}

function readRegionBoxes (svg, regionIds) {
  if (!svg || !regionIds?.length) return []

  return regionIds.flatMap((regionId) => {
    const path = svg.querySelector(`path[data-region="${regionId}"]`)
    if (!path || typeof path.getBBox !== 'function') return []
    const bounds = path.getBBox()
    return [{
      x: bounds.x - REGION_BOX_PAD_X,
      y: bounds.y - REGION_BOX_PAD_Y,
      width: bounds.width + (REGION_BOX_PAD_X * 2),
      height: bounds.height + (REGION_BOX_PAD_Y * 2)
    }]
  })
}

function coursesInBoxes (courses, boxes) {
  if (!boxes.length) return courses
  return courses.filter((course) => (
    boxes.some((box) => pointInBox(course.mapX, course.mapY, box))
  ))
}

function coursesInViewBox (courses, viewBox, margin = 8) {
  return courses.filter((course) => (
    course.mapX >= viewBox.x - margin &&
    course.mapX <= viewBox.x + viewBox.width + margin &&
    course.mapY >= viewBox.y - margin &&
    course.mapY <= viewBox.y + viewBox.height + margin
  ))
}

function projectCoursesOnMap (courses) {
  return courses.flatMap((course) => {
    const lat = Number(course.lat)
    const lng = Number(course.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []
    const [mapX, mapY] = project(lat, lng)
    if (!isOnMap(mapX, mapY)) return []
    return [{ ...course, mapX, mapY }]
  })
}

function CoursesMap ({ courses, playedCourseIds = new Set(), regionFilters = [], onMapClick, pendingLocation }) {
  const svgRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [viewBox, setViewBox] = useState(FULL_VIEW_BOX)
  const [filterBoxes, setFilterBoxes] = useState([])

  const mappableCourses = useMemo(() => projectCoursesOnMap(courses), [courses])

  useLayoutEffect(() => {
    setFilterBoxes(readRegionBoxes(svgRef.current, regionFilters))
  }, [regionFilters, courses])

  const regionFilteredCourses = regionFilters.length
    ? coursesInBoxes(mappableCourses, filterBoxes)
    : mappableCourses

  const visibleCourses = selectedRegion
    ? coursesInViewBox(regionFilteredCourses, viewBox)
    : regionFilteredCourses

  const handleBackgroundClick = (event) => {
    setSelected(null)
    setSelectedRegion(null)
    setViewBox(FULL_VIEW_BOX)
    if (!onMapClick || !svgRef.current) return
    const point = screenToSvgPoint(svgRef.current, event.clientX, event.clientY)
    if (!point) return
    onMapClick(unproject(point.x, point.y))
  }

  const handleRegionClick = (event, region) => {
    if (onMapClick) return // adding a course: let the click bubble up and place a pin instead
    event.stopPropagation()
    setSelected(null)
    const isAlreadySelected = selectedRegion?.id === region.id
    setSelectedRegion(isAlreadySelected ? null : region)
    setViewBox(isAlreadySelected ? FULL_VIEW_BOX : viewBoxForRegion(event.currentTarget))
  }

  const handlePinClick = (event, course) => {
    event.stopPropagation()
    setSelected((current) => (current?.id === course.id ? null : course))
  }

  const clearRegion = () => {
    setSelectedRegion(null)
    setSelected(null)
    setViewBox(FULL_VIEW_BOX)
  }

  const zoomRatio = viewBox.width / MAP_WIDTH
  const pinRadius = PIN_RADIUS * Math.max(zoomRatio, 0.45)
  const pendingRadius = PENDING_RADIUS * Math.max(zoomRatio, 0.45)

  return (
    <div className="nz-map-container">
      {selectedRegion && (
        <div className="nz-map-region-badge">
          <span>
            Showing <strong>{selectedRegion.name}</strong> ({visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'})
          </span>
          <button type="button" className="nz-map-region-clear" onClick={clearRegion}>
            Clear
          </button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="nz-map"
        style={{ cursor: onMapClick ? 'crosshair' : 'default' }}
        onClick={handleBackgroundClick}
        role="img"
        aria-label="Map of New Zealand"
      >
        <NzOutline className="nz-map-island" selectedRegion={selectedRegion?.id} onRegionClick={handleRegionClick} />
        <path d={NZ_INTERNAL_BORDERS_PATH} className="nz-map-borders" />

        {visibleCourses.map((course) => {
          const isPlayed = playedCourseIds.has(Number(course.id))
          const pinClass = [
            'nz-map-pin',
            isPlayed ? 'is-played' : '',
            selected?.id === course.id ? 'is-selected' : ''
          ].filter(Boolean).join(' ')

          return (
            <g
              key={course.id}
              className={pinClass}
              onClick={(event) => handlePinClick(event, course)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handlePinClick(event, course)
              }}
              role="button"
              tabIndex="0"
              aria-label={isPlayed ? `${course.name} (played)` : course.name}
              aria-pressed={selected?.id === course.id}
            >
              <circle cx={course.mapX} cy={course.mapY} r={pinRadius} />
              <title>{isPlayed ? `${course.name} — played` : course.name}</title>
            </g>
          )
        })}

        {pendingLocation && (() => {
          const [x, y] = project(pendingLocation.lat, pendingLocation.lng)
          return <circle cx={x} cy={y} r={pendingRadius} className="nz-map-pending-pin" />
        })()}
      </svg>

      {selected && (
        <div
          className="nz-map-popup"
          style={{
            left: `${((selected.mapX - viewBox.x) / viewBox.width) * 100}%`,
            top: `${((selected.mapY - viewBox.y) / viewBox.height) * 100}%`
          }}
        >
          <strong>{selected.name}</strong>
          <div>{selected.city}, {selected.country}</div>
          <Link to={`/courses/${selected.id}`}>View course</Link>
        </div>
      )}
    </div>
  )
}

export default CoursesMap
