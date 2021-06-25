const path = require('path')
const express = require('express')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const coursesPlayedRoutes = require('./routes/coursesPlayed')
const authRoutes = require('./routes/auth')
const regionsRoutes = require('./routes/regions')

const server = express()

server.use(express.static(path.join(__dirname, 'public')))

server.use('/api/v1/coursesPlayed', coursesPlayedRoutes, regionsRoutes)

module.exports = server
