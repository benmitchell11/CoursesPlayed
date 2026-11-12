exports.up = function (knex) {
  return knex.schema.createTable('courses_played', (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users')
    table.integer('course_id').unsigned().notNullable().references('id').inTable('courses')
    table.date('date_played').notNullable()
    table.integer('rating')
    table.text('notes')
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('courses_played')
}
