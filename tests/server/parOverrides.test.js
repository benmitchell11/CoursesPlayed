const { validateOverride, loadOverrides } = require('../../server/lib/parOverrides')
const shipped = require('../../server/db/seeds/par-overrides.json')

const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]

function entry (overrides = {}) {
  return {
    name: 'Some Golf Club',
    holes: 18,
    hole_pars: PARS,
    source_url: 'https://example.co.nz/the-course',
    checked: '2026-09-25',
    ...overrides
  }
}

describe('validateOverride', () => {
  test('accepts a complete, consistent entry', () => {
    expect(validateOverride(entry())).toEqual([])
    expect(validateOverride(entry({ par: 72 }))).toEqual([])
  })

  test('requires a source URL and a checked date, so nothing is accepted on trust', () => {
    expect(validateOverride(entry({ source_url: undefined }))).toEqual(['missing source_url'])
    expect(validateOverride(entry({ checked: '' }))).toEqual(['missing checked'])
    expect(validateOverride(entry({ source_url: 'the club website' }))).toEqual(['source_url must be a web address'])
    expect(validateOverride(entry({ checked: 'yesterday' }))).toEqual(['checked must be a date (YYYY-MM-DD)'])
  })

  test('rejects a par that does not match its holes', () => {
    expect(validateOverride(entry({ par: 70 }))).toEqual(['par does not equal the sum of hole_pars'])
  })

  test('rejects the wrong number of holes, or a hole par outside 3 to 6', () => {
    expect(validateOverride(entry({ holes: 9 }))).toEqual(['hole_pars must list one par per hole'])
    expect(validateOverride(entry({ holes: 27 }))).toEqual(['holes must be 9 or 18', 'hole_pars must list one par per hole'])
    expect(validateOverride(entry({ hole_pars: [...PARS.slice(0, 17), 9] }))).toEqual(['every hole par must be a whole number from 3 to 6'])
  })
})

describe('loadOverrides', () => {
  test('keys entries by lower-cased name and works the par out from the holes', () => {
    const map = loadOverrides([entry()])
    expect(map.get('some golf club')).toMatchObject({ par: 72, holes: 18, par_source: 'club_checked', checked: '2026-09-25' })
  })

  test('throws on a bad entry, naming it, instead of skipping it', () => {
    expect(() => loadOverrides([entry({ name: 'Bad Club', source_url: undefined })])).toThrow(/Bad par override for "Bad Club": missing source_url/)
  })

  test('throws on duplicates', () => {
    expect(() => loadOverrides([entry(), entry({ name: 'SOME GOLF CLUB' })])).toThrow(/Duplicate par override/)
  })

  test('the overrides file that ships with the app is valid', () => {
    const map = loadOverrides(shipped)
    expect(map.get('otago golf club')).toMatchObject({ holes: 18, par: 71, par_source: 'osm_checked' })
    expect(map.get('waihi golf club')).toMatchObject({ holes: 18, par: 72, par_source: 'club' })
    expect(map.get('northland golf club')).toMatchObject({ holes: 18, par: 71, par_source: 'osm_checked' })
  })
})
