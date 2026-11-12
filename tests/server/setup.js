const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
// Tests never call a real model or Jev, whatever keys are in .env.
for (const key of ['OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'MODEL_PROVIDER', 'JEV_API_KEY', 'TYPESAFE_API_KEY', 'DEMO_MODE']) delete process.env[key]
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const connection = require('../../server/db/connection')

beforeAll(async () => {
  await connection.migrate.latest()
})

afterEach(async () => {
  await connection('forum_replies').del()
  await connection('forum_posts').del()
  await connection('courses_played').del()
  await connection('friendships').del()
  await connection('courses').del()
  await connection('users').del()
})

afterAll(async () => {
  await connection.destroy()
})
