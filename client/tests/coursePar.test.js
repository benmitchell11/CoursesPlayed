import { parForHoles } from '../src/lib/coursePar'

const EIGHTEEN = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4] // 72, front nine 36

describe('parForHoles', () => {
  test('uses the course par for a full round', () => {
    expect(parForHoles({ par: 72, holes: '18', hole_pars: EIGHTEEN }, 18)).toEqual({ par: 72, basis: 'the course list' })
  })

  test('adds up the front nine for nine holes on an 18-hole course', () => {
    expect(parForHoles({ par: 72, holes: '18', hole_pars: EIGHTEEN }, 9)).toEqual({
      par: 36,
      basis: 'the front nine in the course list'
    })
  })

  test('doubles a nine-hole course played twice', () => {
    expect(parForHoles({ par: 35, holes: '9', hole_pars: EIGHTEEN.slice(0, 9) }, 18)).toMatchObject({ par: 70 })
  })

  test('uses a nine-hole course as it is for nine holes', () => {
    expect(parForHoles({ par: 35, holes: '9', hole_pars: EIGHTEEN.slice(0, 9) }, 9)).toMatchObject({ par: 35 })
  })

  test('falls back to par plus the hole count when there is no per-hole list', () => {
    expect(parForHoles({ par: 72, holes: '18', hole_pars: null }, 18)).toMatchObject({ par: 72 })
    expect(parForHoles({ par: 72, holes: '18', hole_pars: null }, 9)).toBeNull()
  })

  test('returns null when the course has no par, and treats a missing hole count as 18', () => {
    expect(parForHoles({ par: null, holes: '18' }, 18)).toBeNull()
    expect(parForHoles(null, 18)).toBeNull()
    expect(parForHoles({ par: 72, holes: '18', hole_pars: EIGHTEEN }, undefined)).toMatchObject({ par: 72 })
  })
})
