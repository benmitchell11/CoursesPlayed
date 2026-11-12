const { assignHoles, deriveCoursePar, deriveAll } = require('../../server/lib/parFromOsm')

const PARS_18 = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4] // 72

function hole (ref, par, lat = -36.9, lon = 174.6) {
  return { center: { lat, lon }, tags: { golf: 'hole', ref: String(ref), par: String(par) } }
}

function holesFor (pars, lat, lon) {
  return pars.map((par, i) => hole(i + 1, par, lat, lon))
}

describe('deriveCoursePar', () => {
  test('sums a complete 18-hole course', () => {
    expect(deriveCoursePar(holesFor(PARS_18))).toEqual({ holes: 18, hole_pars: PARS_18, par: 72 })
  })

  test('sums a complete 9-hole course', () => {
    expect(deriveCoursePar(holesFor(PARS_18.slice(0, 9)))).toMatchObject({ holes: 9, par: 36 })
  })

  test('skips a course with a missing hole rather than guessing it', () => {
    const holes = holesFor(PARS_18).filter((h) => h.tags.ref !== '7')
    expect(deriveCoursePar(holes)).toMatchObject({ skipped: 'incomplete' })
  })

  test('skips conflicting pars for the same hole number', () => {
    const holes = [...holesFor(PARS_18), hole(3, 4)] // hole 3 mapped as both 5 and 4
    expect(deriveCoursePar(holes)).toMatchObject({ skipped: 'conflicting_or_invalid_par' })
  })

  test('accepts the same hole mapped twice with the same par', () => {
    expect(deriveCoursePar([...holesFor(PARS_18), hole(3, 5)])).toMatchObject({ par: 72 })
  })

  test('skips typos like par 52 or par 2', () => {
    const holes = holesFor(PARS_18)
    holes[4].tags.par = '52'
    expect(deriveCoursePar(holes)).toMatchObject({ skipped: 'conflicting_or_invalid_par' })
  })

  test('skips 27-hole layouts, where hole numbers run past 18', () => {
    const holes = holesFor([...PARS_18, 4, 4, 4, 4, 4, 4, 4, 4, 4])
    expect(deriveCoursePar(holes)).toMatchObject({ skipped: 'more_than_18_holes' })
  })

  test('skips a total that could not be a real course', () => {
    expect(deriveCoursePar(holesFor(Array(18).fill(6)))).toEqual({ skipped: 'implausible_total' })
    expect(deriveCoursePar(holesFor(Array(9).fill(6)))).toEqual({ skipped: 'implausible_total' })
  })

  test('accepts an all par-3 course, which is a real thing', () => {
    expect(deriveCoursePar(holesFor(Array(18).fill(3)))).toMatchObject({ holes: 18, par: 54 })
  })

  test('ignores holes with no usable reference number', () => {
    expect(deriveCoursePar([{ center: { lat: 0, lon: 0 }, tags: { par: '4' } }])).toEqual({ skipped: 'no_usable_holes' })
  })
})

describe('assignHoles / deriveAll', () => {
  const courses = [
    { id: 1, name: 'Near Club', lat: -36.9, lng: 174.6 },
    { id: 2, name: 'Far Club', lat: -41.3, lng: 174.8 }
  ]

  test('gives each hole to the nearest course within 2km and drops the rest', () => {
    const near = hole(1, 4, -36.905, 174.605)
    const stray = hole(2, 4, -38.0, 175.0)
    const assigned = assignHoles([near, stray], courses)

    expect(assigned.get(1)).toEqual([near])
    expect(assigned.has(2)).toBe(false)
  })

  test('the nearer of two courses gets a hole between them', () => {
    const close = [{ id: 1, lat: -36.9, lng: 174.6 }, { id: 2, lat: -36.9, lng: 174.615 }]
    const assigned = assignHoles([hole(1, 4, -36.9, 174.612)], close)
    expect(assigned.get(2)).toHaveLength(1)
  })

  test('derives par per course and counts why others were skipped', () => {
    const complete = holesFor(PARS_18, -36.9, 174.6)
    const partial = holesFor(PARS_18.slice(0, 5), -41.3, 174.8)

    const { pars, skipped, coursesWithHoles } = deriveAll([...complete, ...partial], courses)

    expect(coursesWithHoles).toBe(2)
    expect(pars.get(1)).toMatchObject({ holes: 18, par: 72 })
    expect(pars.has(2)).toBe(false)
    expect(skipped.get('incomplete')).toBe(1)
  })

  test('reports unusual hole counts for checking, with what was found, and does not fill them in', () => {
    const twentySeven = holesFor([...PARS_18, 4, 4, 4, 4, 4, 4, 4, 4, 4], -36.9, 174.6)
    const doubled = [...holesFor(PARS_18, -41.3, 174.8), ...holesFor(PARS_18, -41.3, 174.8)]
    doubled[5].tags.par = '5' // hole 6 mapped as both 3 and 5

    const { pars, review } = deriveAll([...twentySeven, ...doubled], courses)

    expect(pars.size).toBe(0)
    const north = review.find((r) => r.courseId === 1)
    expect(north).toMatchObject({ reason: 'more_than_18_holes', holes_found: 27, max_ref: 27, duplicate_refs: [] })
    const two = review.find((r) => r.courseId === 2)
    expect(two).toMatchObject({ reason: 'conflicting_or_invalid_par', holes_found: 36 })
    expect(two.duplicate_refs).toHaveLength(18)
    expect([...two.par_by_ref[6]].sort()).toEqual([3, 5])
  })

  test('a course that is simply only partly mapped is skipped quietly, not sent for review', () => {
    const { review, skipped } = deriveAll(holesFor(PARS_18.slice(0, 5), -36.9, 174.6), courses)
    expect(review).toEqual([])
    expect(skipped.get('incomplete')).toBe(1)
  })
})

