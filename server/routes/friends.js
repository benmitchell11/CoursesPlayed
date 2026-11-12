const express = require('express')

const friends = require('../models/friends')
const requireAuth = require('../middleware/requireAuth')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const [accepted, pending] = await Promise.all([
    friends.listFriends(req.userId),
    friends.listPendingIncoming(req.userId)
  ])
  res.json({ friends: accepted, pending })
}))

router.post('/', asyncHandler(async (req, res) => {
  const username = req.body.username?.trim()
  if (!username) return res.status(400).json({ error: 'username is required' })

  const result = await friends.requestFriend(req.userId, username)
  if (result.error) return res.status(result.status).json({ error: result.error })
  res.status(201).json(result.friendship)
}))

router.post('/:id/accept', asyncHandler(async (req, res) => {
  const result = await friends.acceptFriend(req.userId, Number(req.params.id))
  if (result.error) return res.status(result.status).json({ error: result.error })
  res.json(result.friendship)
}))

module.exports = router
