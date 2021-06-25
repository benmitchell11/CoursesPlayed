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

router.get('/courses/:region_id'), (req, res) => {
  const region_id = req.params.region_id
  courses.getCoursesByRegionID(region_id)
  .then((courses) => {
    return res.json(courses)
  })
  .catch((err) => {
    res.status(500).json({ error: err.message })
  })
}





 
  module.exports = router