// par: total par for the course as played once through (9 or 18 holes).
// hole_pars: JSON array of each hole's par, so a 9-hole round on an 18-hole
// course, or two loops of a 9-hole course, can work out its own par.
// par_source: where the number came from ('osm', later 'scorecard' or 'manual'),
// so an approximate value is never mistaken for an official one.
exports.up = function (knex) {
  return knex.schema.alterTable('courses', (table) => {
    table.integer('par')
    table.string('hole_pars')
    table.string('par_source')
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('courses', (table) => {
    table.dropColumn('par')
    table.dropColumn('hole_pars')
    table.dropColumn('par_source')
  })
}
