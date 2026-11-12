exports.up = function (knex) {
  return knex.schema.alterTable('courses', (table) => {
    table.string('website')
    table.string('phone')
    table.string('email')
    table.string('holes')
    table.string('opening_hours')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('courses', (table) => {
    table.dropColumn('website')
    table.dropColumn('phone')
    table.dropColumn('email')
    table.dropColumn('holes')
    table.dropColumn('opening_hours')
  })
}
