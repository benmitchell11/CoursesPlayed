const request = require('supertest')

const server = require('../../server/server')

describe('auth', () => {
  test('registers a new user and returns a session cookie', async () => {
    const res = await request(server)
      .post('/api/v1/register')
      .send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ username: 'ben', email: 'ben@example.com' })
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/)
  })

  test('rejects registration with a duplicate username', async () => {
    const agent = request.agent(server)
    await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })

    const res = await agent
      .post('/api/v1/register')
      .send({ username: 'ben', email: 'other@example.com', password: 'hunter22' })

    expect(res.status).toBe(409)
  })

  test('signs in with correct credentials', async () => {
    await request(server).post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })

    const res = await request(server).post('/api/v1/signin').send({ username: 'ben', password: 'hunter22' })

    expect(res.status).toBe(200)
    expect(res.body.username).toBe('ben')
  })

  test('rejects signin with wrong password', async () => {
    await request(server).post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })

    const res = await request(server).post('/api/v1/signin').send({ username: 'ben', password: 'wrong' })

    expect(res.status).toBe(401)
  })

  test('GET /me requires a session', async () => {
    const res = await request(server).get('/api/v1/me')
    expect(res.status).toBe(401)
  })

  test('GET /me returns the current user when signed in', async () => {
    const agent = request.agent(server)
    await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })

    const res = await agent.get('/api/v1/me')

    expect(res.status).toBe(200)
    expect(res.body.username).toBe('ben')
  })
})
