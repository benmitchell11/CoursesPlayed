const express = require('express')

const courses = require('../models/courses')
const requireAuth = require('../middleware/requireAuth')
const asyncHandler = require('../middleware/asyncHandler')
const { parseRound, RoundParseError } = require('../lib/roundParser')
const { createLimiter } = require('../lib/rateLimit')

const router = express.Router()

const allow = createLimiter({ max: 10 })

// Turns free text into a *proposal*. Nothing is saved here: the client shows
// the proposal to the golfer and only writes the round once they confirm it.
router.post('/parse', requireAuth, asyncHandler(async (req, res) => {
  if (!allow(req.userId)) {
    return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' })
  }

  try {
    const proposal = await parseRound({
      text: req.body?.text,
      courses: await courses.searchCourses(),
      client: req.app.get('roundParserClient')
    })
    res.json(proposal)
  } catch (err) {
    if (err instanceof RoundParseError) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error('Round parse failed:', err.message)
    res.status(502).json({ error: 'Round parsing is unavailable right now. Try again shortly.' })
  }
}))

module.exports = router
