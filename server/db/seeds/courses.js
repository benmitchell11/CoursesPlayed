
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('courses').del()
    .then(function () {
      // Inserts seed entries
      return knex('courses').insert([
        {id: 1, name: 'Titirangi', country: 'New Zealand', region: 'North Island', photo: 'https://www.titirangigolf.co.nz/wp-content/uploads/titirangi-golf-slider_01.jpg'},
        {id: 2, name: 'Waipu', country: 'New Zealand', region: 'North Island', photo: 'https://www.google.com/search?q=waipu%20golf%20course&tbm=isch&safe=off&tbs=isz:l&rlz=1C1CHBF_enNZ892NZ892&hl=en&sa=X&ved=0CAIQpwVqFwoTCLDy4r_79_ACFQAAAAAdAAAAABAC&biw=1349&bih=600#imgrc=VLSdkiARBszu-M'},
        {id: 3, name: 'Terrace Downs', country: 'New Zealand', region: 'South Island', photo: 'https://www.google.com/search?q=terrace%20downs%20golf&tbm=isch&safe=off&tbs=isz:l&rlz=1C1CHBF_enNZ892NZ892&hl=en&sa=X&ved=0CAIQpwVqFwoTCPCRlur79_ACFQAAAAAdAAAAABAC&biw=1349&bih=600#imgrc=leG4isoTtNNSqM'}
      ]);
    });
};
