
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('courses').del()
    .then(function () {
      // Inserts seed entries
      return knex('courses').insert([
        {id: 1, name: 'Titirangi', country: 'New Zealand', region: 'North Island', photo: 'image'},
        {id: 2, name: 'Waipu', country: 'New Zealand', region: 'North Island', photo: 'image'},
        {id: 3, name: 'Terrace Downs', country: 'New Zealand', region: 'South Island', photo: 'image'}
      ]);
    });
};
