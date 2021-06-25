exports.up = (knex) => {
    knex.schema.hasTable('courses').then(function(exists) {
        if (!exists) {
            return knex.schema.createTable('courses', table => {
                table.increments('id').primary()
                table.string('name')
                table.string('country')
                table.string('region')
                table.integer('region_id')
                table.binary('photo')
               })

        }
    })
};

exports.down = (knex) => {
    return knex.schema.dropTable('courses')
}