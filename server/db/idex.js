const env = process.env.NODE_ENV || 'development'
const config = require('./knexfile')[env]
const connection = require('knex')(config)

module.exports = {
  getCoursesPlayed
}

function getCoursesPlayed (db = connection) {
  return db('getCoursesPlayed').select()
    .catch(err => {
      console.error(err)
      throw err
    })
}