const request = require('supertest')

const server = require('../../server/server')
const connection = require('../../server/db/connection')

const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]

function fakeClient (extracted) {
  return { messages: { parse: async () => ({ parsed_output: extracted, usage: { input_tokens: 1, output_tokens: 1 } }) } }
}

async function signedInAgentWithCourse (extra = {}) {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })
  const created = await agent.post('/api/v1/courses').send({ name: 'Titirangi Golf Club', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })
  if (Object.keys(extra).length) await connection('courses').where({ id: created.body.id }).update(extra)
  return { agent, courseId: created.body.id }
}

describe('course par', () => {
  afterEach(() => {
    server.set('roundParserClient', undefined)
  })

  test('a course with no par returns null, not a made-up value', async () => {
    const { agent, courseId } = await signedInAgentWithCourse()
    const res = await agent.get(`/api/v1/courses/${courseId}`)
    expect(res.body).toMatchObject({ par: null, hole_pars: null, par_source: null })
  })

  test('returns par with the per-hole list as an array, and says where it came from', async () => {
    const { agent, courseId } = await signedInAgentWithCourse({ par: 72, holes: '18', hole_pars: JSON.stringify(PARS), par_source: 'osm' })

    const one = await agent.get(`/api/v1/courses/${courseId}`)
    expect(one.body).toMatchObject({ par: 72, holes: '18', hole_pars: PARS, par_source: 'osm' })

    const list = await agent.get('/api/v1/courses')
    expect(list.body[0].hole_pars).toEqual(PARS)
  })

  test('damaged hole_pars data becomes null instead of an error', async () => {
    const { agent, courseId } = await signedInAgentWithCourse({ par: 72, hole_pars: '{not json' })
    const res = await agent.get(`/api/v1/courses/${courseId}`)
    expect(res.status).toBe(200)
    expect(res.body.hole_pars).toBeNull()
  })

  test('a matched course carries its par into the parse proposal, from the catalogue', async () => {
    const { agent } = await signedInAgentWithCourse({ par: 72, holes: '18', hole_pars: JSON.stringify(PARS), par_source: 'osm' })
    server.set('roundParserClient', fakeClient({
      course_name: 'Titirangi', date_played: '2026-01-15', holes: 18, score: 92, over_par: null,
      rating: null, par: null, course_rating: null, slope: null, notes: ''
    }))

    const res = await agent.post('/api/v1/rounds/parse').send({ text: 'played Titirangi, shot 92' })

    expect(res.body.round.par).toBeNull() // the model was not asked to invent one
    expect(res.body.course.best).toMatchObject({ par: 72, holes: '18', hole_pars: PARS, par_source: 'osm' })
  })
})
