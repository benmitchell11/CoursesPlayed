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
        { id: 1, username: 'admin', email: 'admin@admin.com', profilePic: 'image', country: 'New Zealand', region: 'South Island', handicap: '2', password: 'admin', hash: adminHash, isAdmin: true, confirmed:true, totalCoursesPlayed: '0' },
        { id: 2, username: 'ben', email: 'ben@test.com', profilePic:'https://i.pinimg.com/originals/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg', country: 'New Zealand', region: 'North Island', handicap: '45', password:'ben', hash: benHash, isAdmin: false, confirmed: true, totalCoursesPlayed: '0' }
      ])
    )
}