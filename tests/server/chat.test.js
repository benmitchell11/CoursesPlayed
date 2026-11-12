const request = require('supertest')

const server = require('../../server/server')

function fakeClient ({ intent = {}, replyText = 'An answer.', onClassify } = {}) {
  return {
    messages: {
      parse: async (req) => {
        const content = req.messages[0].content
        if (content.includes('<message>')) {
          if (onClassify) onClassify(content)
          return { parsed_output: { intent: 'off_topic', location: null, course_name: null, course_name_2: null, ...intent }, usage: {} }
        }
        return { parsed_output: { reply: replyText }, usage: {} }
      }
    }
  }
}

async function signedInAgent (username = 'ben') {
  const agent = request.agent(server)
  await agent.post('/api/v1/register').send({ username, email: `${username}@example.com`, password: 'hunter22' })
  await agent.post('/api/v1/courses').send({ name: 'Titirangi Golf Club', city: 'Auckland', country: 'New Zealand', lat: -36.9, lng: 174.6 })
  return agent
}

describe('POST /api/v1/chat', () => {
  afterEach(() => {
    server.set('golfChatClient', undefined)
  })

  test('works signed out, for a public question', async () => {
    server.set('golfChatClient', fakeClient({ intent: { intent: 'list_courses', location: null } }))
    const res = await request(server).post('/api/v1/chat').send({ message: 'what courses are there' })
    expect(res.status).toBe(200)
    expect(res.body.reply).toBe('An answer.')
  })

  test('refuses a personal question when signed out, without a needsData round trip', async () => {
    server.set('golfChatClient', fakeClient({ intent: { intent: 'courses_remaining', location: null } }))
    const res = await request(server).post('/api/v1/chat').send({ message: 'how many courses do I have left' })
    expect(res.status).toBe(200)
    expect(res.body.reply).toMatch(/signed in/)
    expect(res.body.needsData).toBeUndefined()
  })

  test('a signed-in personal question asks the client to fetch its own data, then answers on the follow-up', async () => {
    const agent = await signedInAgent()
    server.set('golfChatClient', fakeClient({ intent: { intent: 'courses_remaining', location: null } }))

    const first = await agent.post('/api/v1/chat').send({ message: 'how many courses do I have left' })
    expect(first.status).toBe(200)
    expect(first.body.needsData).toEqual({ intent: 'courses_remaining', args: { location: null }, fetch: 'getMyPlayedCourses' })

    const second = await agent.post('/api/v1/chat').send({
      message: 'how many courses do I have left',
      context: { intent: 'courses_remaining', args: { location: null }, data: [] }
    })
    expect(second.status).toBe(200)
    expect(second.body.reply).toBe('An answer.')
  })

  test('forwards a sent history into the classify prompt, so a follow-up can be understood', async () => {
    let seen
    server.set('golfChatClient', fakeClient({ intent: { intent: 'list_courses', location: null }, onClassify: (content) => { seen = content } }))
    const res = await request(server).post('/api/v1/chat').send({
      message: 'what about Wellington instead',
      history: [{ role: 'user', text: 'what courses are in Auckland' }, { role: 'assistant', text: 'There are 40.' }]
    })
    expect(res.status).toBe(200)
    expect(seen).toContain('user: what courses are in Auckland')
  })

  test('400s on an empty message', async () => {
    server.set('golfChatClient', fakeClient())
    const res = await request(server).post('/api/v1/chat').send({ message: '' })
    expect(res.status).toBe(400)
  })

  test('502s without leaking details when the model call fails', async () => {
    server.set('golfChatClient', { messages: { parse: async () => { throw new Error('upstream secret detail') } } })
    const res = await request(server).post('/api/v1/chat').send({ message: 'what courses are there' })
    expect(res.status).toBe(502)
    expect(JSON.stringify(res.body)).not.toMatch(/upstream secret detail/)
  })

  test('rate limits after twenty messages in a minute', async () => {
    server.set('golfChatClient', fakeClient({ intent: { intent: 'list_courses', location: null } }))
    let last
    for (let i = 0; i < 21; i++) {
      last = await request(server).post('/api/v1/chat').send({ message: 'what courses are there' })
    }
    expect(last.status).toBe(429)
  })
})
