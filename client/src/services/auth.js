import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'

import { auth, db } from '../firebase'

function normaliseUsername (username) {
  return String(username || '').trim().toLowerCase()
}

function mapAuthError (error) {
  const code = error?.code || ''
  if (code.includes('email-already-in-use')) return 'Email is already registered'
  if (code.includes('invalid-email')) return 'Invalid email address'
  if (code.includes('weak-password')) return 'Password should be at least 6 characters'
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect username/email or password'
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later'
  return error?.message || 'Authentication failed'
}

export async function getUserProfile (uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

function mapUser (uid, profile, fallback = {}) {
  return {
    id: uid,
    username: profile?.username || fallback.username || 'golfer',
    email: profile?.email || fallback.email || null,
    handicap: profile?.handicap ?? null,
    isAdmin: Boolean(profile?.isAdmin)
  }
}

function parseHandicap (value) {
  if (value == null || value === '') return null
  const handicap = Number(value)
  if (!Number.isFinite(handicap)) {
    throw new Error('Handicap must be a number')
  }
  if (handicap < 0 || handicap > 54) {
    throw new Error('Handicap must be between 0 and 54')
  }
  return Math.round(handicap * 10) / 10
}

export async function updateHandicap (handicap) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')

  const nextHandicap = parseHandicap(handicap)
  await setDoc(doc(db, 'users', uid), { handicap: nextHandicap }, { merge: true })

  const profile = await getUserProfile(uid)
  return mapUser(uid, profile, { email: auth.currentUser.email })
}

export async function register ({ email, username, password }) {
  const cleanUsername = String(username || '').trim()
  const usernameKey = normaliseUsername(cleanUsername)
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!cleanEmail || !cleanUsername || !password) {
    throw new Error('Email, username and password are required')
  }

  const usernameRef = doc(db, 'usernames', usernameKey)
  const existing = await getDoc(usernameRef)
  if (existing.exists()) {
    throw new Error('Username is already taken')
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
    const { user } = credential
    await updateProfile(user, { displayName: cleanUsername })

    const profile = {
      username: cleanUsername,
      usernameLower: usernameKey,
      email: cleanEmail,
      createdAt: serverTimestamp()
    }

    await setDoc(doc(db, 'users', user.uid), profile)
    await setDoc(usernameRef, {
      uid: user.uid,
      username: cleanUsername,
      email: cleanEmail
    })

    return {
      id: user.uid,
      username: cleanUsername,
      email: cleanEmail,
      handicap: null,
      isAdmin: false
    }
  } catch (error) {
    throw new Error(mapAuthError(error))
  }
}

export async function signIn ({ username, email, password }) {
  const login = String(email || username || '').trim()
  if (!login || !password) {
    throw new Error('Username/email and password are required')
  }

  let loginEmail = login
  if (!login.includes('@')) {
    const snap = await getDoc(doc(db, 'usernames', normaliseUsername(login)))
    if (!snap.exists()) {
      throw new Error('Incorrect username/email or password')
    }
    loginEmail = snap.data().email
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, loginEmail, password)
    const profile = await getUserProfile(credential.user.uid)
    return mapUser(credential.user.uid, profile, {
      username: login,
      email: credential.user.email
    })
  } catch (error) {
    throw new Error(mapAuthError(error))
  }
}

export async function signOut () {
  await firebaseSignOut(auth)
}

export function watchAuth (callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }

    let profile = await getUserProfile(firebaseUser.uid)
    const username = profile?.username || firebaseUser.displayName || 'golfer'
    if (profile && !profile.usernameLower && username) {
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        { usernameLower: String(username).trim().toLowerCase() },
        { merge: true }
      )
      profile = await getUserProfile(firebaseUser.uid)
    }

    callback(mapUser(firebaseUser.uid, profile, {
      username,
      email: firebaseUser.email
    }))
  })
}

export async function getIdToken (forceRefresh = false) {
  if (!auth.currentUser) return null
  return auth.currentUser.getIdToken(forceRefresh)
}
