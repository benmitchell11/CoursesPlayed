const config = require('../knexfile').development
const db =require('knex')(config)

module.exports = {
    getCourses,
}


function getCourses () {
    return db('courses')
    .select('id', 'name', 'country', 'region', 'photo')
}

function getCoursesByRegion () {
    
}