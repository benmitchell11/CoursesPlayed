exports.up = function (knex) {
  return knex.schema.createTable('forum_posts', (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users')
    table.integer('course_id').unsigned().references('id').inTable('courses')
    table.string('title').notNullable()
    table.text('body').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('forum_posts')
}
