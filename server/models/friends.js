const connection = require('../db/connection')

module.exports = {
  requestFriend,
  acceptFriend,
  listFriends,
  listPendingIncoming,
  getAcceptedFriendIds,
  getFriendshipBetween
}

function getFriendshipBetween (userId, otherUserId, db = connection) {
  return db('friendships')
    .where(function () {
      this.where({ requester_id: userId, addressee_id: otherUserId })
        .orWhere({ requester_id: otherUserId, addressee_id: userId })
    })
    .first()
}

async function requestFriend (userId, username, db = connection) {
  const other = await db('users').select('id', 'username').where({ username }).first()
  if (!other) return { error: 'User not found', status: 404 }
  if (other.id === userId) return { error: 'You cannot add yourself', status: 400 }

  const existing = await getFriendshipBetween(userId, other.id, db)
  if (existing) {
    if (existing.status === 'accepted') return { error: 'Already friends', status: 409 }
    if (existing.requester_id === userId) return { error: 'Friend request already sent', status: 409 }
    // They already requested you — accept instead of creating a duplicate.
    await db('friendships').where({ id: existing.id }).update({ status: 'accepted' })
    return { friendship: await db('friendships').where({ id: existing.id }).first() }
  }

  const [id] = await db('friendships').insert({
    requester_id: userId,
    addressee_id: other.id,
    status: 'pending'
  })

  return { friendship: await db('friendships').where({ id }).first() }
}

async function acceptFriend (userId, friendshipId, db = connection) {
  const friendship = await db('friendships').where({ id: friendshipId }).first()
  if (!friendship) return { error: 'Request not found', status: 404 }
  if (friendship.addressee_id !== userId) return { error: 'Not your request to accept', status: 403 }
  if (friendship.status === 'accepted') return { friendship }

  await db('friendships').where({ id: friendshipId }).update({ status: 'accepted' })
  return { friendship: await db('friendships').where({ id: friendshipId }).first() }
}

function getAcceptedFriendIds (userId, db = connection) {
  return db('friendships')
    .where({ status: 'accepted' })
    .andWhere(function () {
      this.where('requester_id', userId).orWhere('addressee_id', userId)
    })
    .then((rows) => rows.map((row) => (
      row.requester_id === userId ? row.addressee_id : row.requester_id
    )))
}

async function listFriends (userId, db = connection) {
  const friendIds = await getAcceptedFriendIds(userId, db)
  if (!friendIds.length) return []

  return db('users')
    .select('id', 'username')
    .whereIn('id', friendIds)
    .orderBy('username', 'asc')
}

function listPendingIncoming (userId, db = connection) {
  return db('friendships')
    .select(
      'friendships.id',
      'friendships.created_at',
      'users.id as user_id',
      'users.username'
    )
    .join('users', 'users.id', 'friendships.requester_id')
    .where({
      'friendships.addressee_id': userId,
      'friendships.status': 'pending'
    })
    .orderBy('friendships.created_at', 'desc')
}
