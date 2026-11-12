const { matchCourse } = require('../../server/lib/courseMatch')

const courses = [
  { id: 1, name: 'Titirangi Golf Club', city: 'Auckland' },
  { id: 2, name: 'Waitemata Golf Club', city: 'Auckland' },
  { id: 3, name: 'Papamoa Beach Golf Club', city: 'Papamoa' },
  { id: 4, name: 'The Grange Golf Club', city: 'Auckland' },
  { id: 5, name: 'Russley Golf Club', city: 'Christchurch' },
  { id: 6, name: 'Russley Park Golf Course', city: 'Christchurch' }
]

describe('matchCourse', () => {
  test('matches an exact name, ignoring golf-club filler words', () => {
    const result = matchCourse('Titirangi', courses)
    expect(result.confident).toBe(true)
    expect(result.best.id).toBe(1)
  })

  test('tolerates a typo', () => {
    expect(matchCourse('Titirangy', courses).best?.id).toBe(1)
  })

  test('ignores macrons and case', () => {
    expect(matchCourse('PĀPĀMOA beach', courses).best?.id).toBe(3)
  })

  test('ignores a leading "the"', () => {
    expect(matchCourse('Grange', courses).best?.id).toBe(4)
  })

  test('returns candidates but no confident match when two courses fit', () => {
    const result = matchCourse('Russley', courses)
    expect(result.best).toBeNull()
    expect(result.confident).toBe(false)
    expect(result.candidates.map((c) => c.id)).toEqual(expect.arrayContaining([5, 6]))
  })

  test('treats an apostrophe as part of the word, not a separator', () => {
    const catalogue = [{ id: 7, name: 'Jacks Point Golf Course', city: 'Queenstown' }, ...courses]
    expect(matchCourse("Jack's Point", catalogue).best?.id).toBe(7)
    expect(matchCourse('Jack’s Point', catalogue).best?.id).toBe(7)
  })

  test('finds macron names whether or not the golfer typed the macron', () => {
    const catalogue = [
      { id: 1, name: 'Ōtaki Golf Club', city: 'New Zealand' },
      { id: 2, name: 'Whakatāne Golf Club', city: 'New Zealand' },
      { id: 3, name: 'Ōpōtiki Golf Club', city: 'New Zealand' },
      { id: 4, name: 'Te Ārai Links', city: 'New Zealand' },
      { id: 5, name: 'Māhia Golf Course', city: 'New Zealand' },
      { id: 6, name: 'Waitematā Golf Club', city: 'Narrow Neck' },
      { id: 7, name: 'Tauranga Golf Club', city: 'Tauranga' }
    ]
    const idFor = (text) => matchCourse(text, catalogue).best?.id

    // typed without macrons, as many people will
    expect(idFor('Otaki')).toBe(1)
    expect(idFor('Whakatane golf club')).toBe(2)
    expect(idFor('Opotiki')).toBe(3)
    expect(idFor('Te Arai Links')).toBe(4)
    expect(idFor('Mahia')).toBe(5)
    expect(idFor('Waitemata')).toBe(6)
    // typed with them
    expect(idFor('Ōtaki')).toBe(1)
    expect(idFor('Ōpōtiki')).toBe(3)
    expect(idFor('Whakatāne')).toBe(2)
    // and a plain name typed with a macron someone added
    expect(idFor('Taurānga')).toBe(7)
  })

  test("credits the course's city, as on a card that says \"RNZAF Auckland\"", () => {
    const catalogue = [
      { id: 1, name: 'RNZAF Golf Club', city: 'Auckland' },
      { id: 2, name: 'Royal Auckland Golf Course', city: 'Auckland' },
      { id: 3, name: 'Formosa Auckland Country Club', city: 'Beachlands, Auckland' }
    ]
    const result = matchCourse('RNZAF Auckland', catalogue)
    expect(result.confident).toBe(true)
    expect(result.best.id).toBe(1)
  })

  test('a city on its own never picks a course', () => {
    const catalogue = [
      { id: 1, name: 'RNZAF Golf Club', city: 'Auckland' },
      { id: 2, name: 'Titirangi Golf Club', city: 'Auckland' }
    ]
    const result = matchCourse('Auckland', catalogue)
    expect(result.best).toBeNull()
    expect(result.candidates).toEqual([])
  })

  test('returns nothing for a course that is not in the catalogue', () => {
    const result = matchCourse('Augusta National', courses)
    expect(result.best).toBeNull()
    expect(result.candidates).toEqual([])
  })

  test('returns nothing for empty input', () => {
    expect(matchCourse('', courses).candidates).toEqual([])
    expect(matchCourse('golf club', courses).candidates).toEqual([])
  })
})
