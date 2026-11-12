import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

import { getForumPost, replyToForumPost } from '../apiClient'

function ForumPost () {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [replyBody, setReplyBody] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    getForumPost(id)
      .then((data) => { setPost(data.post); setReplies(data.replies) })
      .catch((err) => setError(err.message))
  }, [id])

  const handleReply = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      const updatedReplies = await replyToForumPost(id, replyBody)
      setReplies(updatedReplies)
      setReplyBody('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <div className="container"><p className="help is-danger">{error}</p></div>
  if (!post) return null

  return (
    <div className="container">
      <Link to="/forum">&larr; Back to forum</Link>
      <h1 className="title">{post.title}</h1>
      <h2 className="subtitle">by {post.username}</h2>
      <p>{post.body}</p>

      <h3 className="title is-5" style={{ marginTop: '2rem' }}>Replies</h3>
      {!replies.length && <p>No replies yet.</p>}
      {replies.map((reply) => (
        <div className="box" key={reply.id}>
          <p><strong>{reply.username}</strong></p>
          <p>{reply.body}</p>
        </div>
      ))}

      <form onSubmit={handleReply} className="field">
        <div className="control">
          <textarea
            className="textarea" placeholder="Write a reply"
            value={replyBody} onChange={(event) => setReplyBody(event.target.value)} required
          />
        </div>
        <div className="control" style={{ marginTop: '0.5rem' }}>
          <button type="submit" className="button is-primary">Reply</button>
        </div>
      </form>
    </div>
  )
}

export default ForumPost
