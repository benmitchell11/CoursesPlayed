const request = require('supertest')

const server = require('../../server/server')

async function registerAgent (username, email) {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username, email, password: 'hunter22' })
  return agent
}

describe('friends', () => {
  test('can send and accept a friend request, then see friend on course played summary', async () => {
    const ben = await registerAgent('ben', 'ben@example.com')
    const alice = await registerAgent('alice', 'alice@example.com')

    const courseRes = await ben.post('/api/v1/courses').send({
      name: 'Titirangi',
      city: 'Auckland',
      country: 'New Zealand',
      lat: -36.9,
      lng: 174.6
    })
    const courseId = courseRes.body.id

    await alice.post('/api/v1/courses-played').send({ courseId, datePlayed: '2026-01-01', rating: 5, notes: 'Fun' })

    const requestRes = await ben.post('/api/v1/friends').send({ username: 'alice' })
    expect(requestRes.status).toBe(201)

    const pendingRes = await alice.get('/api/v1/friends')
    expect(pendingRes.status).toBe(200)
    expect(pendingRes.body.pending).toHaveLength(1)
    expect(pendingRes.body.pending[0].username).toBe('ben')

    const acceptRes = await alice.post(`/api/v1/friends/${pendingRes.body.pending[0].id}/accept`)
    expect(acceptRes.status).toBe(200)

    const friendsRes = await ben.get('/api/v1/friends')
    expect(friendsRes.body.friends.map((friend) => friend.username)).toContain('alice')

    const publicSummary = await request(server).get(`/api/v1/courses/${courseId}/played`)
    expect(publicSummary.status).toBe(200)
    expect(publicSummary.body).toMatchObject({ count: 1, friends: [] })

    const signedInSummary = await ben.get(`/api/v1/courses/${courseId}/played`)
    expect(signedInSummary.status).toBe(200)
    expect(signedInSummary.body.count).toBe(1)
    expect(signedInSummary.body.friends).toHaveLength(1)
    expect(signedInSummary.body.friends[0]).toMatchObject({ username: 'alice', rating: 5 })
  })
})
