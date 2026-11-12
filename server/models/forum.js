const connection = require('../db/connection')

module.exports = {
  getPosts,
  createPost,
  getPostById,
  getRepliesByPost,
  createReply
}

function getPosts (db = connection) {
  return db('forum_posts')
    .select('forum_posts.*', 'users.username')
    .join('users', 'users.id', 'forum_posts.user_id')
    .orderBy('forum_posts.created_at', 'desc')
}

function createPost ({ userId, title, body, courseId }, db = connection) {
  return db('forum_posts')
    .insert({ user_id: userId, title, body, course_id: courseId || null })
    .then(([id]) => getPostById(id, db))
}

function getPostById (id, db = connection) {
  return db('forum_posts')
    .select('forum_posts.*', 'users.username')
    .join('users', 'users.id', 'forum_posts.user_id')
    .where('forum_posts.id', id)
    .first()
}

function getRepliesByPost (postId, db = connection) {
  return db('forum_replies')
    .select('forum_replies.*', 'users.username')
    .join('users', 'users.id', 'forum_replies.user_id')
    .where('forum_replies.post_id', postId)
    .orderBy('forum_replies.created_at', 'asc')
}

function createReply ({ userId, postId, body }, db = connection) {
  return db('forum_replies').insert({ user_id: userId, post_id: postId, body })
}
