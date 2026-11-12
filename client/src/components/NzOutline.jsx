import React from 'react'

import { NZ_REGIONS } from '../nzRegions'

function NzOutline ({ className, selectedRegion, onRegionClick }) {
  return (
    <g className={className}>
      {NZ_REGIONS.map((region) => (
        <path
          key={region.id}
          d={region.d}
          data-region={region.id}
          className={`nz-map-region${selectedRegion === region.id ? ' is-selected' : ''}`}
          onClick={(event) => onRegionClick?.(event, region)}
        />
      ))}
    </g>
  )
}

export default NzOutline
