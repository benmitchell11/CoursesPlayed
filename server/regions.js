const config = require('../knexfile').development
const db = require('knex')(config)

module.exports = {
    getRegions,
    getRegion,
    getRegionByName,
    
}


function getRegions() {
    return db('regions')
    .select('id', 'name', 'island')
}

function getRegion(id) {
    return db('regions')
    .select('regions.id as regionID', 'name', 'island')
    .where('regionID', id)
    .first()
}

function getRegionByName(name) {
    return db('regions')
    .select('id', 'name', 'island')
    .where('name', name)
    .first()
}

