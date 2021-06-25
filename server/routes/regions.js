const express = require('express')
const regions = require('../regions')
const router = express.Router()




router.get('/regioncourses/:id', (req, res) =>{
    const id = Number(req.params.id)
    regions.getRegion(id)
    .then((singleRegion) => {
      return res.json(singleRegion)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
  })
  

  
  module.exports = router