const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const authRoutes = require('./routes/auth')
const coursesRoutes = require('./routes/courses')
const coursesPlayedRoutes = require('./routes/coursesPlayed')
const friendsRoutes = require('./routes/friends')
const forumRoutes = require('./routes/forum')
const roundsRoutes = require('./routes/rounds')
const scorecardsRoutes = require('./routes/scorecards')
const chatRoutes = require('./routes/chat')
const requireAuth = require('./middleware/requireAuth')

const server = express()

server.use(cookieParser())

// Photos arrive as base64, well over the default 100kb body limit, so this route
// gets its own parser. Auth runs first so nobody unauthenticated can post 7MB.
server.use('/api/v1/scorecards', requireAuth, express.json({ limit: '7mb' }), scorecardsRoutes, scorecardsRoutes.tooLarge)

server.use(express.json())
server.use(express.static(path.join(__dirname, 'public')))

server.use('/api/v1', authRoutes)
server.use('/api/v1/courses', coursesRoutes)
server.use('/api/v1/courses-played', coursesPlayedRoutes)
server.use('/api/v1/friends', friendsRoutes)
server.use('/api/v1/forum', forumRoutes)
server.use('/api/v1/rounds', roundsRoutes)
server.use('/api/v1/chat', chatRoutes)

// eslint-disable-next-line no-unused-vars
server.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = server
