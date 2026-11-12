const connection = require('../db/connection')
const friends = require('./friends')

module.exports = {
  logPlayed,
  getPlayedByUser,
  getPlayedByCourse,
  getPlayedSummaryForCourse,
  getPlayedById,
  deletePlayed
}

function logPlayed ({ userId, courseId, datePlayed, rating, notes }, db = connection) {
  return db('courses_played')
    .insert({ user_id: userId, course_id: courseId, date_played: datePlayed, rating, notes })
    .then(([id]) => getPlayedById(id, db))
}

function getPlayedByUser (userId, db = connection) {
  return db('courses_played')
    .select('courses_played.*', 'courses.name as course_name', 'courses.city', 'courses.country')
    .join('courses', 'courses.id', 'courses_played.course_id')
    .where('courses_played.user_id', userId)
    .orderBy('date_played', 'desc')
}

function getPlayedByCourse (courseId, db = connection) {
  return db('courses_played')
    .select('courses_played.*', 'users.username')
    .join('users', 'users.id', 'courses_played.user_id')
    .where('courses_played.course_id', courseId)
    .orderBy('date_played', 'desc')
}

async function getPlayedSummaryForCourse (courseId, userId = null, db = connection) {
  const countRow = await db('courses_played')
    .where({ course_id: courseId })
    .countDistinct('user_id as count')
    .first()

  const count = Number(countRow?.count || 0)
  if (!userId) return { count, friends: [] }

  const friendIds = await friends.getAcceptedFriendIds(userId, db)
  if (!friendIds.length) return { count, friends: [] }

  const friendEntries = await db('courses_played')
    .select(
      'courses_played.id',
      'courses_played.date_played',
      'courses_played.rating',
      'courses_played.notes',
      'users.id as user_id',
      'users.username'
    )
    .join('users', 'users.id', 'courses_played.user_id')
    .where('courses_played.course_id', courseId)
    .whereIn('courses_played.user_id', friendIds)
    .orderBy('date_played', 'desc')

  // One entry per friend (most recent round).
  const seen = new Set()
  const uniqueFriends = []
  for (const entry of friendEntries) {
    if (seen.has(entry.user_id)) continue
    seen.add(entry.user_id)
    uniqueFriends.push(entry)
  }

  return { count, friends: uniqueFriends }
}

function getPlayedById (id, db = connection) {
  return db('courses_played').select().where({ id }).first()
}

function deletePlayed (id, userId, db = connection) {
  return db('courses_played').where({ id, user_id: userId }).del()
}
