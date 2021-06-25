exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('regions').del()
    .then(function () {
      // Inserts seed entries
      return knex('regions').insert([
        {id: 1, name: 'Manawatu-Wanganui', island:'North Island'},
        {id: 2, name: 'Gisborne District', island: 'North Island'},
        {id: 3, name: "Hawke's Bay", island: 'North Island'},
        {id: 4, name: 'Auckland', island: 'North Island'},
        {id: 5, name: 'Bay of Plenty', island: 'North Island'},
        {id: 6, name: 'Canterbury', island: 'South Island'},
        {id: 7, name: 'Marlborough District', island: 'South Island'},
        {id: 8, name: 'Nelson City', island: 'South Island'},
        {id: 9, name: 'Tasman District', island: 'South Island'},
        {id: 10, name: 'Northland', island: 'North Island'},
        {id: 11, name: 'Taranaki', island: 'North Island'},
        {id: 12, name: 'West Coast', island: 'South Island'},
        {id: 13, name: 'Otago', island: 'South Island'},
        {id: 14, name: 'Southland', island: 'South Island'},
        {id: 15, name: 'Waikato', island: 'North Island'},
        {id: 16, name: 'Wellington', island: 'North Island'}
      ]);
    });
};