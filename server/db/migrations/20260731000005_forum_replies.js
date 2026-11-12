exports.up = function (knex) {
  return knex.schema.createTable('forum_replies', (table) => {
    table.increments('id').primary()
    table.integer('post_id').unsigned().notNullable().references('id').inTable('forum_posts')
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users')
    table.text('body').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('forum_replies')
}
