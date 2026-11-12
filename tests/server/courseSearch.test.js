const request = require('supertest')

const server = require('../../server/server')

async function seedCourses (entries) {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })
  for (const [name, city = 'Auckland'] of entries) {
    await agent.post('/api/v1/courses').send({ name, city, country: 'New Zealand', lat: -36.9, lng: 174.6 })
  }
  return agent
}

const NAMES = [
  'Zealandia', 'Ōtaki Golf Club', 'Alpha Golf Club', 'prodrive Golf', 'Waihi Golf Club',
  'Ōpōtiki Golf Club', 'Omaha Golf Club', 'Pongaroa Golf Club', 'Whakatāne Golf Club', 'Whangarei Golf Club'
]

const searchNames = async (agent, q) => (await agent.get('/api/v1/courses').query({ search: q })).body.map((c) => c.name)

describe('course ordering', () => {
  test('puts macron names among their letter, and ignores case, instead of at the end', async () => {
    const agent = await seedCourses(NAMES.map((n) => [n]))

    const names = (await agent.get('/api/v1/courses')).body.map((c) => c.name)

    expect(names).toEqual([
      'Alpha Golf Club',
      'Omaha Golf Club',
      'Ōpōtiki Golf Club',
      'Ōtaki Golf Club',
      'Pongaroa Golf Club',
      'prodrive Golf',
      'Waihi Golf Club',
      'Whakatāne Golf Club',
      'Whangarei Golf Club',
      'Zealandia'
    ])
  })
})

describe('course search', () => {
  test('finds a macron name typed without the macron', async () => {
    const agent = await seedCourses(NAMES.map((n) => [n]))

    expect(await searchNames(agent, 'otaki')).toEqual(['Ōtaki Golf Club'])
    expect(await searchNames(agent, 'Whakatane')).toEqual(['Whakatāne Golf Club'])
    expect(await searchNames(agent, 'opotiki')).toEqual(['Ōpōtiki Golf Club'])
  })

  test('finds a plain name typed with the macron', async () => {
    const agent = await seedCourses([['Otaki Golf Club'], ['Whakatane Golf Club']])

    expect(await searchNames(agent, 'Ōtaki')).toEqual(['Otaki Golf Club'])
    expect(await searchNames(agent, 'Whakatāne')).toEqual(['Whakatane Golf Club'])
  })

  test('ignores case, apostrophes and extra spaces, and still matches on city', async () => {
    const agent = await seedCourses([["Jack's Point Golf Course", 'Queenstown'], ['Te Ārai Links', 'Te Arai']])

    expect(await searchNames(agent, 'JACKS   point')).toEqual(["Jack's Point Golf Course"])
    expect(await searchNames(agent, 'te arai')).toEqual(['Te Ārai Links'])
    expect(await searchNames(agent, 'queenstown')).toEqual(["Jack's Point Golf Course"])
  })

  test('an empty or punctuation-only search returns everything, and the country filter still applies', async () => {
    const agent = await seedCourses([['Ōtaki Golf Club'], ['Alpha Golf Club']])

    expect((await agent.get('/api/v1/courses').query({ search: '  ' })).body).toHaveLength(2)
    expect((await agent.get('/api/v1/courses').query({ search: '!!' })).body).toHaveLength(2)
    expect((await agent.get('/api/v1/courses').query({ country: 'Australia' })).body).toHaveLength(0)
  })
})
