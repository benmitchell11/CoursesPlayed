const express = require('express')
const regions = require('../regions')
const router = express.Router()




router.get('/testingregion/:id', (req, res) =>{
    const id = Number(req.params.id)
    regions.getRegion(id)
    .then((singleRegion) => {
      return res.json(singleRegion)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
  })

  router.get('/regioncourses/:name', (req, res) => {
    const name = (req.params.name)
    regions.getRegionByName(name)
    .then((singleRegion) => {
      return res.json(singleRegion)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
  })
  

  
  module.exports = router