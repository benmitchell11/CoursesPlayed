const express = require('express')

const courses = require('../models/courses')
const asyncHandler = require('../middleware/asyncHandler')
const { parseScorecard, ScorecardParseError } = require('../lib/scorecardParser')
const { ImageInputError } = require('../lib/imageInput')
const { createLimiter } = require('../lib/rateLimit')

const router = express.Router()

// A vision call costs more than a text one, so the cap is lower.
const allow = createLimiter({ max: 5 })

// Turns a photo into a *proposal*. Nothing is saved and the photo is not kept:
// the client shows what was read and only writes a round once it is confirmed.
// The route is mounted after requireAuth (see server.js), so req.userId is set.
router.post('/parse', asyncHandler(async (req, res) => {
  if (!allow(req.userId)) {
    return res.status(429).json({ error: 'Too many photos. Wait a minute and try again.' })
  }

  try {
    const proposal = await parseScorecard({
      image: req.body?.image,
      mediaType: req.body?.mediaType,
      courses: await courses.searchCourses(),
      client: req.app.get('scorecardParserClient')
    })
    res.json(proposal)
  } catch (err) {
    if (err instanceof ScorecardParseError || err instanceof ImageInputError) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error('Scorecard parse failed:', err.message)
    res.status(502).json({ error: 'Scorecard reading is unavailable right now. Try again shortly.' })
  }
}))

// body-parser's "too large" error is raised before the router runs, so this has
// to be mounted in the same chain as the parser (see server.js). Without it the
// error falls through to the generic 500 handler.
// eslint-disable-next-line no-unused-vars
function tooLarge (err, req, res, next) {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'That photo is too large. Try a smaller one.' })
  }
  next(err)
}

module.exports = router
module.exports.tooLarge = tooLarge
