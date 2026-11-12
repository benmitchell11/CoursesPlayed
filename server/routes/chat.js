const express = require('express')

const courses = require('../models/courses')
const optionalAuth = require('../middleware/optionalAuth')
const asyncHandler = require('../middleware/asyncHandler')
const { chat, ChatError } = require('../lib/golfChat')
const { createLimiter } = require('../lib/rateLimit')

const router = express.Router()

// Each turn is one or two cheap model calls, so this is looser than the round/scorecard
// limiters, keyed by user id when signed in and by IP when not.
const allow = createLimiter({ max: 20 })

router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  if (!allow(req.userId || req.ip)) {
    return res.status(429).json({ error: 'Too many messages. Wait a minute and try again.' })
  }

  try {
    const result = await chat({
      message: req.body?.message,
      userId: req.userId,
      context: req.body?.context || null,
      history: req.body?.history,
      courses: await courses.searchCourses(),
      client: req.app.get('golfChatClient')
    })
    res.json(result)
  } catch (err) {
    if (err instanceof ChatError) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error('Chat failed:', err.message)
    res.status(502).json({ error: 'Chat is unavailable right now. Try again shortly.' })
  }
}))

module.exports = router
