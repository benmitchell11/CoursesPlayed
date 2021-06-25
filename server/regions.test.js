const knex = require('knex')
const regions = require('./regions')
const config = require('../knexfile').test
const testDb = knex(config)

test('getRegion returns the correct region', () => {
    return regions.getRegion(4, testDb)
    .then(region => {
        expect(region.name).toMatch('Auckland')
    })
})

test('getRegionByName returns the correct region', () => {
    return regions.getRegionByName('Auckland', testDb)
    .then(region => {
        expect(region.island).toMatch('North Island')
        expect(region.id).toBe(4)
    })
})