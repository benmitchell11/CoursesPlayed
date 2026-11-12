import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { getForumPosts, createForumPost } from '../apiClient'

function NewPostForm ({ onSubmit }) {
  const [form, setForm] = useState({ title: '', body: '' })
  const [error, setError] = useState(null)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    try {
      await onSubmit(form)
      setForm({ title: '', body: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="box" onSubmit={handleSubmit}>
      <h2 className="title is-5">New post</h2>
      {error && <p className="help is-danger">{error}</p>}
      <div className="field">
        <input className="input" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      </div>
      <div className="field">
        <textarea className="textarea" name="body" placeholder="What's on your mind?" value={form.body} onChange={handleChange} required />
      </div>
      <button type="submit" className="button is-primary">Post</button>
    </form>
  )
}

function Forum () {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState(null)

  const loadPosts = () => {
    getForumPosts().then(setPosts).catch((err) => setError(err.message))
  }

  useEffect(loadPosts, [])

  const handleNewPost = async (post) => {
    await createForumPost(post)
    loadPosts()
  }

  return (
    <div className="container">
      <h1 className="title">Forum</h1>

      {error && <p className="help is-danger">{error}</p>}

      <NewPostForm onSubmit={handleNewPost} />

      <div className="menu">
        <ul className="menu-list">
          {posts.map((post) => (
            <li key={post.id}>
              <Link to={`/forum/${post.id}`}>
                <strong>{post.title}</strong> — by {post.username}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Forum
