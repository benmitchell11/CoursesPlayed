const request = require('supertest')

const server = require('../../server/server')

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]).toString('base64')

const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]
const STROKES = [5, 4, 6, 5, 4, 3, 5, 6, 5, 5, 4, 4, 6, 5, 3, 5, 6, 5]

const extraction = {
  course_name: 'Titirangi',
  date_played: null,
  tee: null,
  course_rating: null,
  slope: null,
  holes: PARS.map((par, i) => ({ hole: i + 1, par, distance: null, stroke_index: null })),
  players: [{
    name: 'Ben',
    scores: STROKES.map((strokes, i) => ({ hole: i + 1, strokes, legible: true })),
    printed_out: null,
    printed_in: null,
    printed_total: null
  }]
}

function fakeClient (extracted) {
  return { messages: { parse: async () => ({ parsed_output: extracted, usage: { input_tokens: 1, output_tokens: 1 } }) } }
}

async function signedInAgent (username = 'ben') {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username, email: `${username}@example.com`, password: 'hunter22' })
  return agent
}

describe('POST /api/v1/scorecards/parse', () => {
  afterEach(() => {
    server.set('scorecardParserClient', undefined)
  })

  test('requires a signed-in user, before any body is read', async () => {
    const res = await request(server).post('/api/v1/scorecards/parse').send({ image: JPEG, mediaType: 'image/jpeg' })
    expect(res.status).toBe(401)
  })

  test('returns a proposal and saves nothing', async () => {
    const agent = await signedInAgent()
    await agent.post('/api/v1/courses').send({ name: 'Titirangi Golf Club', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })
    server.set('scorecardParserClient', fakeClient(extraction))

    const res = await agent.post('/api/v1/scorecards/parse').send({ image: JPEG, mediaType: 'image/jpeg' })

    expect(res.status).toBe(200)
    expect(res.body.course.best.name).toBe('Titirangi Golf Club')
    expect(res.body.players[0].total).toBe(86)
    expect((await agent.get('/api/v1/courses-played')).body).toEqual([])
  })

  test('400s on something that is not an image', async () => {
    const agent = await signedInAgent()
    server.set('scorecardParserClient', fakeClient(extraction))
    const notAnImage = Buffer.from('hello world, definitely not a jpeg').toString('base64')

    const res = await agent.post('/api/v1/scorecards/parse').send({ image: notAnImage, mediaType: 'image/jpeg' })

    expect(res.status).toBe(400)
  })

  test('413s on a body over the size limit instead of a generic 500', async () => {
    const agent = await signedInAgent()
    const huge = 'A'.repeat(8 * 1024 * 1024)

    const res = await agent.post('/api/v1/scorecards/parse').send({ image: huge, mediaType: 'image/jpeg' })

    expect(res.status).toBe(413)
    expect(res.body.error).toMatch(/too large/i)
  })

  test('502s without leaking details when the model call fails', async () => {
    const agent = await signedInAgent()
    server.set('scorecardParserClient', { messages: { parse: async () => { throw new Error('upstream secret detail') } } })

    const res = await agent.post('/api/v1/scorecards/parse').send({ image: JPEG, mediaType: 'image/jpeg' })

    expect(res.status).toBe(502)
    expect(JSON.stringify(res.body)).not.toMatch(/upstream secret detail/)
  })

  test('rate limits a user after five photos in a minute', async () => {
    const agent = await signedInAgent('busy')
    server.set('scorecardParserClient', fakeClient(extraction))

    let last
    for (let i = 0; i < 6; i++) {
      last = await agent.post('/api/v1/scorecards/parse').send({ image: JPEG, mediaType: 'image/jpeg' })
    }
    expect(last.status).toBe(429)
  })
})
