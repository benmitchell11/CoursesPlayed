const { areTwins } = require('../../server/lib/courseTwins')
const { matchCourse } = require('../../server/lib/courseMatch')

const AKL = { lat: -36.9, lng: 174.6 }

describe('areTwins', () => {
  test('the same course under a different suffix is a twin', () => {
    expect(areTwins({ id: 1, name: 'Titirangi Golf Club', ...AKL }, { id: 2, name: 'Titirangi Golf Course', lat: -36.92, lng: 174.62 })).toBe(true)
  })

  test('different names are not twins, even sharing a word', () => {
    expect(areTwins({ id: 1, name: 'Russley Golf Club', ...AKL }, { id: 2, name: 'Russley Park Golf Course', ...AKL })).toBe(false)
  })

  test('the same name far apart is a different course', () => {
    expect(areTwins({ id: 1, name: 'Hamilton Golf Club', ...AKL }, { id: 2, name: 'Hamilton Golf Course', lat: -45.9, lng: 170.5 })).toBe(false)
  })

  test('a row is not its own twin, and missing coordinates fall back to the name', () => {
    expect(areTwins({ id: 1, name: 'A Golf Club' }, { id: 1, name: 'A Golf Club' })).toBe(false)
    expect(areTwins({ id: 1, name: 'Titirangi Golf Club' }, { id: 2, name: 'Titirangi Golf Course' })).toBe(true)
  })
})

describe('matchCourse with duplicate listings', () => {
  const catalogue = [
    { id: 10, name: 'Titirangi Golf Club', city: 'Auckland', par: null, ...AKL },
    { id: 20, name: 'Titirangi Golf Course', city: 'Auckland', par: 71, holes: '18', ...AKL },
    { id: 30, name: 'Russley Golf Club', city: 'Christchurch', par: 72, lat: -43.5, lng: 172.5 },
    { id: 31, name: 'Russley Park Golf Course', city: 'Christchurch', par: 72, lat: -43.5, lng: 172.5 }
  ]

  test('treats twins as one course and offers the one that has a par', () => {
    const result = matchCourse('Titirangi', catalogue)
    expect(result.confident).toBe(true)
    expect(result.best).toMatchObject({ id: 20, par: 71 })
    expect(result.candidates).toHaveLength(1)
  })

  test('falls back to the lower id when neither twin has a par', () => {
    const noPar = catalogue.map((c) => ({ ...c, par: null }))
    expect(matchCourse('Titirangi', noPar).best?.id).toBe(10)
  })

  test('still reports two genuinely different courses as ambiguous', () => {
    const result = matchCourse('Russley', catalogue)
    expect(result.best).toBeNull()
    expect(result.candidates.map((c) => c.id)).toEqual(expect.arrayContaining([30, 31]))
  })
})
