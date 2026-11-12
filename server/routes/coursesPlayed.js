const express = require('express')

const coursesPlayed = require('../models/coursesPlayed')
const requireAuth = require('../middleware/requireAuth')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  res.json(await coursesPlayed.getPlayedByUser(req.userId))
}))

router.post('/', asyncHandler(async (req, res) => {
  const { courseId, datePlayed, rating, notes } = req.body

  if (!courseId || !datePlayed) {
    return res.status(400).json({ error: 'courseId and datePlayed are required' })
  }

  const played = await coursesPlayed.logPlayed({ userId: req.userId, courseId, datePlayed, rating, notes })
  res.status(201).json(played)
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await coursesPlayed.deletePlayed(req.params.id, req.userId)
  if (!deleted) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
}))

module.exports = router
