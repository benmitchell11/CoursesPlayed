// Projects real lat/lng onto the pixel space of client/src/assets/nz-map-source.svg
// (viewBox 0 0 1000 1330). That artwork is a Mercator map from SimpleMaps; the
// scale/offset below were fit to the three lat/lng-tagged calibration points in
// the SVG's <g id="points"> group.
export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 1330

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

// svg_x = X_SCALE * mercX(lng) + X_OFFSET
// svg_y = Y_SCALE * mercY(lat) + Y_OFFSET
const X_SCALE = 4043.9542440346427
const X_OFFSET = -11676.25695987064
const Y_SCALE = -4044.1166675444842
const Y_OFFSET = -2533.5339703932577

function mercatorX (lng) {
  return lng * DEG2RAD
}

function mercatorY (lat) {
  const φ = lat * DEG2RAD
  return Math.log(Math.tan(Math.PI / 4 + φ / 2))
}

export function project (lat, lng) {
  const x = X_SCALE * mercatorX(lng) + X_OFFSET
  const y = Y_SCALE * mercatorY(lat) + Y_OFFSET
  return [x, y]
}

export function unproject (x, y) {
  const mx = (x - X_OFFSET) / X_SCALE
  const my = (y - Y_OFFSET) / Y_SCALE
  const lng = mx * RAD2DEG
  const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * RAD2DEG
  return { lat, lng }
}
