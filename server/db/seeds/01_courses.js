const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const importedCourses = require('./nz-courses.json')

// A curated list of real, well-known New Zealand golf courses used to seed
// the database so search/map/played-tracking aren't empty on first run.
// Coordinates are approximate (town/course centroid), sourced via web search.
const curatedCourses = [
  { name: 'Kauri Cliffs', city: 'Matauri Bay', country: 'New Zealand', lat: -35.0333, lng: 173.9333 },
  { name: 'Te Arai Links', city: 'Te Arai', country: 'New Zealand', lat: -36.3167, lng: 174.5667 },
  { name: 'Arikikapakapa Rotorua Golf Club', city: 'Rotorua', country: 'New Zealand', lat: -38.1500, lng: 176.2500 },
  { name: 'Christchurch Golf Club', city: 'Shirley, Christchurch', country: 'New Zealand', lat: -43.5000, lng: 172.6500 },
  { name: 'Wairakei International Golf Course', city: 'Taupo', country: 'New Zealand', lat: -38.6167, lng: 176.1000 },
  { name: 'The Hills', city: 'Arrowtown', country: 'New Zealand', lat: -44.9500, lng: 168.8167 },
  { name: 'Formosa Auckland Country Club', city: 'Beachlands, Auckland', country: 'New Zealand', lat: -36.9333, lng: 175.0000 },
  { name: 'Royal Wellington Golf Club', city: 'Heretaunga, Upper Hutt', country: 'New Zealand', lat: -41.1333, lng: 175.0500 },
  { name: 'Chamberlain Park Golf Course', city: 'Meadowbank, Auckland', country: 'New Zealand', lat: -36.8667, lng: 174.8167 },
  { name: 'Nelson Golf Club', city: 'Nelson', country: 'New Zealand', lat: -41.2833, lng: 173.2833 },
  { name: 'Wanaka Golf Club', city: 'Wanaka', country: 'New Zealand', lat: -44.697148, lng: 169.142815 },
  { name: 'Alexandra Golf Club', city: 'Alexandra', country: 'New Zealand', lat: -45.232177, lng: 169.375915 },
  { name: 'Awatere Golf Club', city: 'Seddon', country: 'New Zealand', lat: -41.663227, lng: 174.073111 },
  { name: 'Blenheim Golf Club', city: 'Blenheim', country: 'New Zealand', lat: -41.505212, lng: 173.950528 },
  { name: 'Culverden Golf Club', city: 'Culverden', country: 'New Zealand', lat: -42.766887, lng: 172.850195 },
  { name: 'Fairlie Golf Club', city: 'Fairlie', country: 'New Zealand', lat: -44.103733, lng: 170.834640 },
  { name: 'Greymouth Golf Club', city: 'Greymouth', country: 'New Zealand', lat: -42.454732, lng: 171.254851 },
  { name: 'Hutt Park Golf Centre', city: 'Lower Hutt', country: 'New Zealand', lat: -41.231103, lng: 174.904717 },
  { name: 'Kawhia Golf Club', city: 'Kawhia', country: 'New Zealand', lat: -38.059375, lng: 174.811881 },
  { name: 'Kurow Golf Club', city: 'Kurow', country: 'New Zealand', lat: -44.738486, lng: 170.467854 },
  { name: 'Lincoln Golf Club', city: 'Lincoln', country: 'New Zealand', lat: -43.632866, lng: 172.486282 },
  { name: 'Manukorihi Golf Club', city: 'Waitara', country: 'New Zealand', lat: -39.014276, lng: 174.264046 },
  { name: 'Marlborough Golf Club', city: 'Blenheim', country: 'New Zealand', lat: -41.534500, lng: 173.896600 },
  { name: 'Mayfield Golf Club', city: 'Mayfield', country: 'New Zealand', lat: -43.816426, lng: 171.440378 },
  { name: 'Ngunguru Golf Club', city: 'Ngunguru', country: 'New Zealand', lat: -35.689000, lng: 174.276000 },
  { name: 'Ngawi Hit Around Golf Links', city: 'Ngawi', country: 'New Zealand', lat: -41.581127, lng: 175.229583 },
  { name: 'Onekaka Links Golf Club', city: 'Onekaka', country: 'New Zealand', lat: -40.748145, lng: 172.710792 },
  { name: 'Orlando Country Club', city: 'Palmerston North', country: 'New Zealand', lat: -40.326075, lng: 175.583228 },
  { name: 'Otakou Golf Club', city: 'Otakou', country: 'New Zealand', lat: -45.808192, lng: 170.689356 },
  { name: 'Picton Golf Club', city: 'Picton', country: 'New Zealand', lat: -41.337763, lng: 173.968147 },
  { name: 'Pirongia Golf Club', city: 'Pirongia', country: 'New Zealand', lat: -37.980920, lng: 175.201591 },
  { name: 'Pongaroa Golf Club', city: 'Pongaroa', country: 'New Zealand', lat: -40.540443, lng: 176.178803 },
  { name: 'Rangitikei Golf Club', city: 'Bulls', country: 'New Zealand', lat: -40.193899, lng: 175.332405 },
  { name: 'Rarangi Golf Club', city: 'Rarangi', country: 'New Zealand', lat: -41.404109, lng: 174.040420 },
  { name: 'Stewart Alexander Golf Club', city: 'Te Awamutu', country: 'New Zealand', lat: -38.032653, lng: 175.268846 },
  { name: 'The Gobbler', city: 'Longbush', country: 'New Zealand', lat: -41.119869, lng: 175.629773 },
  { name: 'Totaradale Golf Club', city: 'Wakefield', country: 'New Zealand', lat: -41.395636, lng: 173.030513 },
  { name: 'Tuatapere Golf Club', city: 'Tuatapere', country: 'New Zealand', lat: -46.046239, lng: 167.708819 },
  { name: 'Waipawa Golf Club', city: 'Waipawa', country: 'New Zealand', lat: -39.951119, lng: 176.594433 },
  { name: 'Wairau Valley Golf Club', city: 'Wairau Valley', country: 'New Zealand', lat: -41.559244, lng: 173.523490 },
  { name: 'Westown Golf Club', city: 'New Plymouth', country: 'New Zealand', lat: -39.130468, lng: 174.085502 }
]

const courses = [...new Map(
  [...importedCourses, ...curatedCourses].map((course) => [course.name.toLowerCase(), course])
).values()]

exports.seed = async function (knex) {
  let seedUser = await knex('users').where({ username: 'nz_golf_seed' }).first()

  if (!seedUser) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10)
    await knex('users').insert({
      username: 'nz_golf_seed',
      email: 'seed@coursesplayed.local',
      password_hash: passwordHash
    })
    seedUser = await knex('users').where({ username: 'nz_golf_seed' }).first()
  }

  const existingNames = new Set(
    (await knex('courses').select('name')).map((course) => course.name.toLowerCase())
  )
  const missingCourses = courses
    .filter((course) => !existingNames.has(course.name.toLowerCase()))
    .map((course) => ({
      name: course.name,
      city: course.city,
      country: course.country,
      lat: course.lat,
      lng: course.lng,
      website: course.website || null,
      phone: course.phone || null,
      email: course.email || null,
      holes: course.holes || null,
      opening_hours: course.opening_hours || null,
      par: course.par || null,
      hole_pars: course.hole_pars ? JSON.stringify(course.hole_pars) : null,
      par_source: course.par_source || null,
      created_by: seedUser.id
    }))

  if (missingCourses.length) {
    await knex.batchInsert('courses', missingCourses, 100)
  }
}
