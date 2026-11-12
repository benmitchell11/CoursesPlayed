const express = require('express')
const jwt = require('jsonwebtoken')

const users = require('../models/users')
const requireAuth = require('../middleware/requireAuth')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7 // 7 days

function setAuthCookie (res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE
  })
}

router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' })
  }

  if (await users.getUserByUsername(username)) {
    return res.status(409).json({ error: 'Username is already taken' })
  }

  const user = await users.createUser({ username, email, password })
  setAuthCookie(res, user.id)
  res.status(201).json(users.toSafeUser(user))
}))

router.post('/signin', asyncHandler(async (req, res) => {
  const { username, password } = req.body

  const user = await users.getUserByUsername(username)
  const valid = user && await users.verifyPassword(password, user.password_hash)

  if (!valid) {
    return res.status(401).json({ error: 'Incorrect username or password' })
  }

  setAuthCookie(res, user.id)
  res.json(users.toSafeUser(user))
}))

router.post('/signout', (req, res) => {
  res.clearCookie('token')
  res.status(204).end()
})

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await users.getUserById(req.userId)
  res.json(users.toSafeUser(user))
}))

module.exports = router
