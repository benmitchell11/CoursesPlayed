exports.up = function (knex) {
  return knex.schema.createTable('friendships', (table) => {
    table.increments('id').primary()
    table.integer('requester_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.integer('addressee_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('status').notNullable().defaultTo('pending')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.unique(['requester_id', 'addressee_id'])
  })
}

exports.down = function (knex) {
  return knex.schema.dropTable('friendships')
}
