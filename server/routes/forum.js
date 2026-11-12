const express = require('express')

const forum = require('../models/forum')
const requireAuth = require('../middleware/requireAuth')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
  res.json(await forum.getPosts())
}))

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { title, body, courseId } = req.body

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' })
  }

  const post = await forum.createPost({ userId: req.userId, title, body, courseId })
  res.status(201).json(post)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const post = await forum.getPostById(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  const replies = await forum.getRepliesByPost(req.params.id)
  res.json({ post, replies })
}))

router.post('/:id/replies', requireAuth, asyncHandler(async (req, res) => {
  const { body } = req.body

  if (!body) {
    return res.status(400).json({ error: 'Body is required' })
  }

  await forum.createReply({ userId: req.userId, postId: req.params.id, body })
  res.status(201).json(await forum.getRepliesByPost(req.params.id))
}))

module.exports = router
