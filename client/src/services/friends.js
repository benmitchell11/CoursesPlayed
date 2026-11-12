import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore'

import { auth, db } from '../firebase'

function requireUid () {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')
  return uid
}

async function getUsernameMap (uids) {
  const unique = [...new Set(uids.filter(Boolean))]
  const entries = await Promise.all(unique.map(async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid))
    return [uid, snap.exists() ? snap.data().username : 'golfer']
  }))
  return Object.fromEntries(entries)
}

export async function getAcceptedFriendIds (uid = auth.currentUser?.uid) {
  if (!uid) return []

  const [asRequester, asAddressee] = await Promise.all([
    getDocs(query(
      collection(db, 'friendships'),
      where('requesterId', '==', uid),
      where('status', '==', 'accepted')
    )),
    getDocs(query(
      collection(db, 'friendships'),
      where('addresseeId', '==', uid),
      where('status', '==', 'accepted')
    ))
  ])

  const ids = new Set()
  asRequester.docs.forEach((item) => ids.add(item.data().addresseeId))
  asAddressee.docs.forEach((item) => ids.add(item.data().requesterId))
  return [...ids]
}

export async function getFriends () {
  const uid = requireUid()

  const [acceptedIds, pendingSnap] = await Promise.all([
    getAcceptedFriendIds(uid),
    getDocs(query(
      collection(db, 'friendships'),
      where('addresseeId', '==', uid),
      where('status', '==', 'pending')
    ))
  ])

  const usernameMap = await getUsernameMap([
    ...acceptedIds,
    ...pendingSnap.docs.map((item) => item.data().requesterId)
  ])

  return {
    friends: acceptedIds
      .map((id) => ({ id, username: usernameMap[id] || 'golfer' }))
      .sort((a, b) => a.username.localeCompare(b.username)),
    pending: pendingSnap.docs.map((item) => {
      const data = item.data()
      return {
        id: item.id,
        user_id: data.requesterId,
        username: usernameMap[data.requesterId] || 'golfer',
        created_at: data.createdAt || null
      }
    })
  }
}

export async function sendFriendRequest (username) {
  const uid = requireUid()
  const key = String(username || '').trim().toLowerCase()
  if (!key) throw new Error('username is required')

  const usernameSnap = await getDoc(doc(db, 'usernames', key))
  if (!usernameSnap.exists()) throw new Error('User not found')

  const otherUid = usernameSnap.data().uid
  if (otherUid === uid) throw new Error('You cannot add yourself')

  const [sent, received] = await Promise.all([
    getDocs(query(
      collection(db, 'friendships'),
      where('requesterId', '==', uid),
      where('addresseeId', '==', otherUid)
    )),
    getDocs(query(
      collection(db, 'friendships'),
      where('requesterId', '==', otherUid),
      where('addresseeId', '==', uid)
    ))
  ])

  if (!sent.empty) {
    const existing = sent.docs[0].data()
    if (existing.status === 'accepted') throw new Error('Already friends')
    throw new Error('Friend request already sent')
  }

  if (!received.empty) {
    const existing = received.docs[0]
    if (existing.data().status === 'accepted') throw new Error('Already friends')
    await updateDoc(doc(db, 'friendships', existing.id), { status: 'accepted' })
    return { id: existing.id, status: 'accepted' }
  }

  const ref = await addDoc(collection(db, 'friendships'), {
    requesterId: uid,
    addresseeId: otherUid,
    status: 'pending',
    createdAt: serverTimestamp()
  })

  return { id: ref.id, status: 'pending' }
}

export async function acceptFriendRequest (id) {
  const uid = requireUid()
  const ref = doc(db, 'friendships', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Request not found')

  const data = snap.data()
  if (data.addresseeId !== uid) throw new Error('Not your request to accept')
  if (data.status === 'accepted') return { id, status: 'accepted' }

  await updateDoc(ref, { status: 'accepted' })
  return { id, status: 'accepted' }
}

/**
 * @returns {{ status: 'none'|'pending_sent'|'pending_received'|'friends'|'self', requestId?: string }}
 */
export async function getFriendshipStatus (otherUid) {
  const uid = requireUid()
  if (!otherUid) throw new Error('User id is required')
  if (otherUid === uid) return { status: 'self' }

  const [sent, received] = await Promise.all([
    getDocs(query(
      collection(db, 'friendships'),
      where('requesterId', '==', uid),
      where('addresseeId', '==', otherUid)
    )),
    getDocs(query(
      collection(db, 'friendships'),
      where('requesterId', '==', otherUid),
      where('addresseeId', '==', uid)
    ))
  ])

  if (!sent.empty) {
    const item = sent.docs[0]
    const data = item.data()
    if (data.status === 'accepted') return { status: 'friends', requestId: item.id }
    return { status: 'pending_sent', requestId: item.id }
  }

  if (!received.empty) {
    const item = received.docs[0]
    const data = item.data()
    if (data.status === 'accepted') return { status: 'friends', requestId: item.id }
    return { status: 'pending_received', requestId: item.id }
  }

  return { status: 'none' }
}
