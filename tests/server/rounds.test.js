const request = require('supertest')

const server = require('../../server/server')

function fakeClient (extracted) {
  return { messages: { parse: async () => ({ parsed_output: extracted, usage: { input_tokens: 1, output_tokens: 1 } }) } }
}

const extraction = {
  course_name: 'Titirangi',
  date_played: '2026-01-15',
  holes: 18,
  score: 92,
  over_par: null,
  rating: null,
  par: null,
  course_rating: null,
  slope: null,
  notes: ''
}

async function signedInAgent (username = 'ben') {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username, email: `${username}@example.com`, password: 'hunter22' })
  return agent
}

describe('POST /api/v1/rounds/parse', () => {
  afterEach(() => {
    server.set('roundParserClient', undefined)
  })

  test('requires a signed-in user', async () => {
    const res = await request(server).post('/api/v1/rounds/parse').send({ text: 'Titirangi 92' })
    expect(res.status).toBe(401)
  })

  test('returns a proposal and saves nothing', async () => {
    const agent = await signedInAgent()
    await agent.post('/api/v1/courses').send({ name: 'Titirangi Golf Club', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })
    server.set('roundParserClient', fakeClient(extraction))

    const res = await agent.post('/api/v1/rounds/parse').send({ text: 'played Titirangi, shot 92' })

    expect(res.status).toBe(200)
    expect(res.body.course.best.name).toBe('Titirangi Golf Club')
    expect(res.body.round.score).toBe(92)

    const saved = await agent.get('/api/v1/courses-played')
    expect(saved.body).toEqual([])
  })

  test('400s on text that is too short', async () => {
    const agent = await signedInAgent()
    server.set('roundParserClient', fakeClient(extraction))
    const res = await agent.post('/api/v1/rounds/parse').send({ text: 'a' })
    expect(res.status).toBe(400)
  })

  test('502s without leaking details when the model call fails', async () => {
    const agent = await signedInAgent()
    server.set('roundParserClient', { messages: { parse: async () => { throw new Error('upstream secret detail') } } })

    const res = await agent.post('/api/v1/rounds/parse').send({ text: 'Titirangi 92' })

    expect(res.status).toBe(502)
    expect(JSON.stringify(res.body)).not.toMatch(/upstream secret detail/)
  })

  test('rate limits a user after ten parses in a minute', async () => {
    const agent = await signedInAgent('busy')
    server.set('roundParserClient', fakeClient(extraction))

    let last
    for (let i = 0; i < 11; i++) {
      last = await agent.post('/api/v1/rounds/parse').send({ text: 'Titirangi 92' })
    }
    expect(last.status).toBe(429)
  })
})
