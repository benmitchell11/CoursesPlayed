exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary()
    table.string('username').notNullable().unique()
    table.string('email').notNullable().unique()
    table.string('password_hash').notNullable()
    table.boolean('is_admin').notNullable().defaultTo(false)
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('users')
}
