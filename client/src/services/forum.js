import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore'

import { auth, db } from '../firebase'

function requireUid () {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')
  return uid
}

async function getUsername (uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().username : 'golfer'
}

export async function getForumPosts () {
  const snap = await getDocs(query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc')))
  const posts = []

  for (const item of snap.docs) {
    const data = item.data()
    posts.push({
      id: item.id,
      title: data.title,
      body: data.body,
      course_id: data.courseId || null,
      user_id: data.userId,
      username: data.username || await getUsername(data.userId),
      created_at: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null
    })
  }

  return posts
}

export async function createForumPost ({ title, body, courseId }) {
  const uid = requireUid()
  if (!title?.trim() || !body?.trim()) {
    throw new Error('Title and body are required')
  }

  const username = await getUsername(uid)
  const ref = await addDoc(collection(db, 'forumPosts'), {
    title: title.trim(),
    body: body.trim(),
    courseId: courseId || null,
    userId: uid,
    username,
    createdAt: serverTimestamp()
  })

  const snap = await getDoc(ref)
  const data = snap.data()
  return {
    id: ref.id,
    title: data.title,
    body: data.body,
    course_id: data.courseId,
    user_id: uid,
    username,
    created_at: new Date().toISOString()
  }
}

export async function getForumPost (id) {
  const snap = await getDoc(doc(db, 'forumPosts', id))
  if (!snap.exists()) throw new Error('Post not found')

  const data = snap.data()
  const repliesSnap = await getDocs(
    query(
      collection(db, 'forumReplies'),
      where('postId', '==', id)
    )
  )

  const replies = repliesSnap.docs.map((item) => {
    const reply = item.data()
    return {
      id: item.id,
      body: reply.body,
      user_id: reply.userId,
      username: reply.username || 'golfer',
      created_at: reply.createdAt?.toDate?.()?.toISOString?.() || reply.createdAt || null
    }
  }).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))

  return {
    id: snap.id,
    title: data.title,
    body: data.body,
    course_id: data.courseId || null,
    user_id: data.userId,
    username: data.username || await getUsername(data.userId),
    created_at: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
    replies
  }
}

export async function replyToForumPost (postId, body) {
  const uid = requireUid()
  if (!body?.trim()) throw new Error('Reply body is required')

  const username = await getUsername(uid)
  await addDoc(collection(db, 'forumReplies'), {
    postId,
    body: body.trim(),
    userId: uid,
    username,
    createdAt: serverTimestamp()
  })

  return getForumPost(postId)
}
