exports.up = (knex) => {
    knex.schema.hasTable('users').then(function(exists) {
        if (!exists) {
            return knex.schema.createTable('users', table => {
                table.increments('id').primary()
                table.string('username')
                table.string('email')
                table.binary('profilePic')
                table.string('country')
                table.string('region')
                table.string('handicap')
                table.string('password')
                table.binary('hash')
                table.boolean('isAdmin')
                table.boolean('confirmed')
                table.integer('totalCoursesPlayed')
                
            })

        }
    })
};

exports.down = (knex) => {
    return knex.schema.dropTable('users')
}
