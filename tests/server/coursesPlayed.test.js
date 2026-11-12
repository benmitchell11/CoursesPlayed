const request = require('supertest')

const server = require('../../server/server')

async function signedInAgentWithCourse () {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username: 'ben', email: 'ben@example.com', password: 'hunter22' })
  const course = await agent
    .post('/api/v1/courses')
    .send({ name: 'Titirangi', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })
  return { agent, courseId: course.body.id }
}

describe('courses played', () => {
  test('rejects logging a played course when signed out', async () => {
    const res = await request(server).post('/api/v1/courses-played').send({ courseId: 1, datePlayed: '2026-01-01' })
    expect(res.status).toBe(401)
  })

  test('logs a played course and lists it for the current user', async () => {
    const { agent, courseId } = await signedInAgentWithCourse()

    const logRes = await agent
      .post('/api/v1/courses-played')
      .send({ courseId, datePlayed: '2026-01-01', rating: 5, notes: 'Great round' })

    expect(logRes.status).toBe(201)

    const listRes = await agent.get('/api/v1/courses-played')

    expect(listRes.status).toBe(200)
    expect(listRes.body).toHaveLength(1)
    expect(listRes.body[0]).toMatchObject({ course_name: 'Titirangi', rating: 5, notes: 'Great round' })
  })

  test('returns a played count summary for a course', async () => {
    const { agent, courseId } = await signedInAgentWithCourse()
    await agent.post('/api/v1/courses-played').send({ courseId, datePlayed: '2026-01-01', rating: 4 })

    const res = await request(server).get(`/api/v1/courses/${courseId}/played`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ count: 1, friends: [] })
  })

  test('a user can only delete their own played entry', async () => {
    const { agent, courseId } = await signedInAgentWithCourse()
    const logRes = await agent.post('/api/v1/courses-played').send({ courseId, datePlayed: '2026-01-01' })

    const otherAgent = request.agent(server)
    await otherAgent.post('/api/v1/register').send({ username: 'alice', email: 'alice@example.com', password: 'hunter22' })

    const deniedRes = await otherAgent.delete(`/api/v1/courses-played/${logRes.body.id}`)
    expect(deniedRes.status).toBe(404)

    const okRes = await agent.delete(`/api/v1/courses-played/${logRes.body.id}`)
    expect(okRes.status).toBe(204)
  })
})
