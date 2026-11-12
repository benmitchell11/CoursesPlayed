const bcrypt = require('bcryptjs')
const connection = require('../db/connection')

module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  toSafeUser
}

function createUser ({ username, email, password }, db = connection) {
  return bcrypt.hash(password, 10)
    .then((passwordHash) => {
      return db('users')
        .insert({ username, email, password_hash: passwordHash })
        .then(([id]) => getUserById(id, db))
    })
}

function getUserByUsername (username, db = connection) {
  return db('users').select().where({ username }).first()
}

function getUserById (id, db = connection) {
  return db('users').select().where({ id }).first()
}

function verifyPassword (password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

function toSafeUser (user) {
  if (!user) return null
  const { id, username, email, is_admin: isAdmin } = user
  return { id, username, email, isAdmin: !!isAdmin }
}
