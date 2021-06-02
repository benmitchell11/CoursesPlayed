const { generateHash } = require('authenticare/server')

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(() => Promise.all([
      generateHash('admin'),
      generateHash('ben'),
    ]))
    .then(([adminHash, benHash]) =>
      knex('users').insert([
        { id: 1, username: 'admin', email: 'admin@admin.com', profilePic: 'image', country: 'New Zealand', region: 'South Island', handicap: '2', hash: adminHash, isAdmin: true },
        { id: 2, username: 'ben', email: 'ben@test.com', profilePic: 'image', country: 'New Zealand', region: 'North Island', handicap: '45', hash: benHash, isAdmin: false }
      ])
    )
}