const config = require('../knexfile').development
const db = require('knex')(config)

module.exports = {
    getCourses,
    getCourse,
   
    getCoursesByRegion,
    getCoursesByRegionNumber
    

}


function getCourses () {
    return db('courses')
    .select('id', 'name', 'country', 'region', 'regionNumber', 'photo')
}

function getCourse (id) {
    console.log(id)
    return db('courses')
    .select('courses.id as courseID', 'name', 'country', 'region', 'regionNumber', 'photo')
    .where('courseID', id)
    .first()

}


function getCoursesByRegion (region) {
    console.log(region)
    return db('courses')
    .select('id', 'name', 'country', 'region', 'regionNumber', 'photo')
    .where('region', region)
}

// function getCourseRegion (db) {
//     return db('courses')
//     .join('regions', 'courses.region_id', 'region.id')
//     .select('courses.name as courseName', 'region.name as regionName')
// }

function getCoursesByRegionNumber (regionNumber) {
    return db('courses')
    .select('id', 'name', 'country', 'region', 'regionNumber', 'photo')
    .where('regionNumber', regionNumber)
}
