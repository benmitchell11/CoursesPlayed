exports.up = (knex) => {
    knex.schema.hasTable('regions').then(function(exists) {
        if (!exists) {
            return knex.schema.createTable('regions', table => {
                table.increments('id').primary()
                table.string('name')
                table.string('island')
               })

        }
    })
};

exports.down = (knex) => {
    return knex.schema.dropTable('regions')
}
