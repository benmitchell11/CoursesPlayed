import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where
} from 'firebase/firestore'

import { auth, db } from '../firebase'

function requireUid () {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')
  return uid
}

function mapPublicUser (id, data = {}) {
  return {
    id,
    username: data.username || 'golfer',
    handicap: data.handicap ?? null
  }
}

/** Ensure searchable usernameLower exists (for older accounts). */
export async function ensureUsernameLower (uid, username) {
  if (!uid || !username) return
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  if (data.usernameLower) return
  await setDoc(ref, { usernameLower: String(username).trim().toLowerCase() }, { merge: true })
}

export async function getUserByUsername (username) {
  const key = String(username || '').trim().toLowerCase()
  if (!key) throw new Error('Username is required')

  const usernameSnap = await getDoc(doc(db, 'usernames', key))
  if (!usernameSnap.exists()) return null

  const uid = usernameSnap.data().uid
  const userSnap = await getDoc(doc(db, 'users', uid))
  if (!userSnap.exists()) {
    return mapPublicUser(uid, { username: usernameSnap.data().username || key })
  }
  return mapPublicUser(uid, userSnap.data())
}

export async function searchUsers (term = '') {
  requireUid()
  const needle = String(term || '').trim().toLowerCase()

  let docs = []

  if (!needle) {
    const snap = await getDocs(query(collection(db, 'users'), limit(40)))
    docs = snap.docs
  } else {
    const snap = await getDocs(query(
      collection(db, 'users'),
      where('usernameLower', '>=', needle),
      where('usernameLower', '<=', `${needle}\uf8ff`),
      limit(20)
    ))
    docs = snap.docs

    // Fallback for accounts that never got usernameLower backfilled yet.
    if (docs.length === 0) {
      const exact = await getDoc(doc(db, 'usernames', needle))
      if (exact.exists()) {
        const otherUid = exact.data().uid
        const userSnap = await getDoc(doc(db, 'users', otherUid))
        if (userSnap.exists()) {
          docs = [userSnap]
        } else {
          return [{
            id: otherUid,
            username: exact.data().username || needle,
            handicap: null
          }]
        }
      }
    }
  }

  return docs
    .map((item) => mapPublicUser(item.id, item.data()))
    .sort((a, b) => a.username.localeCompare(b.username))
}
