const request = require('supertest')

const server = require('../../server/server')

async function signedInAgent () {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })
  return agent
}

describe('courses', () => {
  test('rejects creating a course when signed out', async () => {
    const res = await request(server)
      .post('/api/v1/courses')
      .send({ name: 'Titirangi', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })

    expect(res.status).toBe(401)
  })

  test('creates a course when signed in', async () => {
    const agent = await signedInAgent()

    const res = await agent
      .post('/api/v1/courses')
      .send({ name: 'Titirangi', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Titirangi', city: 'Auckland' })
  })

  test('rejects a course missing required fields', async () => {
    const agent = await signedInAgent()

    const res = await agent.post('/api/v1/courses').send({ name: 'Titirangi' })

    expect(res.status).toBe(400)
  })

  test('search filters by name or city', async () => {
    const agent = await signedInAgent()
    await agent.post('/api/v1/courses').send({ name: 'Titirangi', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })
    await agent.post('/api/v1/courses').send({ name: 'Millbrook', city: 'Arrowtown', country: 'New Zealand', lat: -44.9, lng: 168.8 })

    const res = await request(server).get('/api/v1/courses').query({ search: 'Auckland' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Titirangi')
  })

  test('GET /:id 404s for a missing course', async () => {
    const res = await request(server).get('/api/v1/courses/999')
    expect(res.status).toBe(404)
  })
})
