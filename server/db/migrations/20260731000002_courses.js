exports.up = function (knex) {
  return knex.schema.createTable('courses', (table) => {
    table.increments('id').primary()
    table.string('name').notNullable()
    table.string('city').notNullable()
    table.string('country').notNullable()
    table.float('lat').notNullable()
    table.float('lng').notNullable()
    table.integer('created_by').unsigned().notNullable().references('id').inTable('users')
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('courses')
}
