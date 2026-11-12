const express = require('express')

const courses = require('../models/courses')
const coursesPlayed = require('../models/coursesPlayed')
const users = require('../models/users')
const requireAuth = require('../middleware/requireAuth')
const optionalAuth = require('../middleware/optionalAuth')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
  const { search, country } = req.query
  res.json(await courses.searchCourses({ search, country }))
}))

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { name, city, country, lat, lng } = req.body

  if (!name || !city || !country || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Name, city, country, lat and lng are required' })
  }

  // Firebase UIDs are strings; SQLite courses.created_by still references the seed user.
  const seedUser = await users.getUserByUsername('nz_golf_seed')
  const createdBy = seedUser?.id || 1

  const course = await courses.createCourse({
    name,
    city,
    country,
    lat,
    lng,
    createdBy
  })
  res.status(201).json(course)
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const course = await courses.getCourseById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  res.json(course)
}))

router.get('/:id/played', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await coursesPlayed.getPlayedSummaryForCourse(req.params.id, req.userId))
}))

module.exports = router
