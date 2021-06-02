const express = require('express')

const courses = require('../courses')



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
 



 
  module.exports = router