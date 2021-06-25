const config = require('../knexfile').development
const db = require('knex')(config)

module.exports = {
    getCourses,
    getCourse,
   // getCoursesByRegion,
    
    getCoursesByRegionID
    

}


function getCourses () {
    return db('courses')
    .select('id', 'name', 'country', 'photo')
}

function getCourse (id) {
    console.log(id)
    return db('courses')
    .select('courses.id as courseID', 'name', 'country', 'photo')
    .where('courseID', id)
    .first()

}


// function getCoursesByRegion (region) {
//     console.log(region)
//     return db('courses')
//     .select('id', 'name', 'country', 'region', 'photo')
//     .where('region', region)
// }

// function getCourseRegion (db) {
//     return db('courses')
//     .join('regions', 'courses.region_id', 'region.id')
//     .select('courses.name as courseName', 'region.name as regionName')
// }

function getCoursesByRegionID (region_id) {
    return db('courses')
    .select('id', 'name', 'country', 'region_id', 'photo')
    .where('region_id', region_id)
}
