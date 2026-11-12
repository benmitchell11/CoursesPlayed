const request = require('supertest')

const server = require('../../server/server')

async function signedInAgent () {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })
  return agent
}

describe('forum', () => {
  test('rejects creating a post when signed out', async () => {
    const res = await request(server).post('/api/v1/forum').send({ title: 'Hi', body: 'Hello' })
    expect(res.status).toBe(401)
  })

  test('creates a post and lists it', async () => {
    const agent = await signedInAgent()
    const createRes = await agent.post('/api/v1/forum').send({ title: 'Best public course?', body: 'Looking for recs' })
    expect(createRes.status).toBe(201)

    const listRes = await request(server).get('/api/v1/forum')
    expect(listRes.status).toBe(200)
    expect(listRes.body).toHaveLength(1)
    expect(listRes.body[0]).toMatchObject({ title: 'Best public course?', username: 'ben' })
  })

  test('fetches a post with its replies', async () => {
    const agent = await signedInAgent()
    const createRes = await agent.post('/api/v1/forum').send({ title: 'Best public course?', body: 'Looking for recs' })

    await agent.post(`/api/v1/forum/${createRes.body.id}/replies`).send({ body: 'Titirangi is great' })

    const res = await request(server).get(`/api/v1/forum/${createRes.body.id}`)

    expect(res.status).toBe(200)
    expect(res.body.post.title).toBe('Best public course?')
    expect(res.body.replies).toHaveLength(1)
    expect(res.body.replies[0]).toMatchObject({ body: 'Titirangi is great', username: 'ben' })
  })

  test('rejects a reply when signed out', async () => {
    const agent = await signedInAgent()
    const createRes = await agent.post('/api/v1/forum').send({ title: 'Best public course?', body: 'Looking for recs' })

    const res = await request(server).post(`/api/v1/forum/${createRes.body.id}/replies`).send({ body: 'Nope' })
    expect(res.status).toBe(401)
  })
})
