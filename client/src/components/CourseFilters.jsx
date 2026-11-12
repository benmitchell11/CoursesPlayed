import React from 'react'

import { NZ_REGIONS } from '../nzRegions'
import '../styles/CourseFilters.css'

function CourseFilters ({
  user,
  search,
  onSearchChange,
  pinFilter,
  onPinFilterChange,
  selectedRegions,
  onRegionToggle,
  onClearRegions
}) {
  const sortedRegions = [...NZ_REGIONS].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <aside className="course-filters" aria-label="Course filters">
      <h2>Filters</h2>

      <label className="course-filter-label" htmlFor="course-filter-search">
        Search courses
      </label>
      <input
        id="course-filter-search"
        className="input"
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Name or town"
      />

      <fieldset className="course-filter-group">
        <legend>Show pins</legend>
        <label>
          <input
            type="radio"
            name="pin-filter"
            value="all"
            checked={pinFilter === 'all'}
            onChange={() => onPinFilterChange('all')}
          />
          All pins
        </label>
        {user && (
          <>
            <label>
              <input
                type="radio"
                name="pin-filter"
                value="played"
                checked={pinFilter === 'played'}
                onChange={() => onPinFilterChange('played')}
              />
              Played
            </label>
            <label>
              <input
                type="radio"
                name="pin-filter"
                value="unplayed"
                checked={pinFilter === 'unplayed'}
                onChange={() => onPinFilterChange('unplayed')}
              />
              Unplayed
            </label>
          </>
        )}
      </fieldset>

      <details className="course-region-filter">
        <summary>
          Display by region
          {selectedRegions.length > 0 && <span>{selectedRegions.length}</span>}
        </summary>
        <div className="course-region-options">
          <label>
            <input
              type="checkbox"
              checked={selectedRegions.length === 0}
              onChange={onClearRegions}
            />
            All regions
          </label>
          {sortedRegions.map((region) => (
            <label key={region.id}>
              <input
                type="checkbox"
                checked={selectedRegions.includes(region.id)}
                onChange={() => onRegionToggle(region.id)}
              />
              {region.name}
            </label>
          ))}
        </div>
      </details>
    </aside>
  )
}

export default CourseFilters
