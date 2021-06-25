const knex = require('knex')
const courses = require('./courses')
const config = require('../knexfile').test
const testDb = knex(config)


test('getCourse returns the correct course', () => {
    return courses.getCourse(1, testDb)
    .then(course => {
        expect(course.name).toMatch('Titirangi')
        
    })
})

// test('getCoursesByRegion returns the correct courses', () => {
//     return courses.getCoursesByRegion('Auckland', testDb)
//     .then(courses => {
//         expect(courses).toHaveLength(13)
        
//     })
// })


test('getCourseByRegionID returns the correct courses', () => {
    return courses.getCoursesByRegionID(4, testDb)
    .then(courses => {
        expect(courses).toHaveLength(13)
    })
})


