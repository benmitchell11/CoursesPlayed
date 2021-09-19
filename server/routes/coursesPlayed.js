const express = require('express')
const courses = require('../courses')
const users = require('../users')
const router = express.Router()
const utils = require('../db/utils')



  router.get('/', (req, res) => {
  courses.getCourses()
    .then((courses) => {
      return res.json({ courses })
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
})

router.get('/regiontesting/:id', (req, res) => {
  const id = Number(req.params.id)
  courses.getCourse(id)
  .then((singleCourse) => {
    return res.json(singleCourse)
  })
  .catch((err) => {
    res.status(500).json({ error: err.message })
  })
})
 
router.get('/userprofile/:id', (req, res) => {
  const id = Number(req.params.id)
  users.getUserById(id)
    .then((singleUser) => {
      return res.json(singleUser)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
})

router.get('/coursesbyregion/:regionnumber', (req, res) => {
  const regionNumber = Number(req.params.regionNumber)
  courses.getCoursesByRegionNumber(regionNumber)
  .then((courses) => {
    return res.json(courses)
  })
  .catch((err) => {
    res.status(500).json({ error: err.message })
  })
})

router.get('/regioncourses/:regionNumber', (req, res) => {
  const regionNumber = req.params.regionNumber
  courses.getCoursesByRegionNumber(regionNumber)
    .then((courses) => {
      return res.json(courses)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
})


 
  module.exports = router