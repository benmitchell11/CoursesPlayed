import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

function markDocId (uid, courseId) {
  return `${uid}_${Number(courseId)}`
}

function mapRound (item) {
  const data = item.data()
  return {
    id: item.id,
    course_id: data.courseId,
    course_name: data.courseName || 'Course',
    city: data.city || '',
    country: data.country || 'New Zealand',
    date_played: data.datePlayed,
    rating: data.rating ?? null,
    notes: data.notes || '',
    score: data.score ?? null,
    holes: data.holes ?? null,
    par: data.par ?? null,
    course_rating: data.courseRating ?? null,
    slope: data.slope ?? null,
    tee: data.tee ?? null,
    hole_scores: data.holeScores ?? null,
    source: data.source ?? 'form',
    user_id: data.userId
  }
}

function mapMark (item) {
  const data = item.data()
  return {
    id: item.id,
    course_id: data.courseId,
    course_name: data.courseName || 'Course',
    city: data.city || '',
    country: data.country || 'New Zealand',
    marked_at: data.markedAt || null,
    user_id: data.userId
  }
}

/** Courses a user has marked as played (no round details required). */
export async function getPlayedCoursesForUser (uid) {
  if (!uid) throw new Error('User id is required')

  const snap = await getDocs(
    query(collection(db, 'playedCourses'), where('userId', '==', uid))
  )

  const marks = snap.docs.map(mapMark)

  const roundsSnap = await getDocs(
    query(collection(db, 'coursesPlayed'), where('userId', '==', uid))
  )
  const seen = new Set(marks.map((mark) => Number(mark.course_id)))
  for (const item of roundsSnap.docs) {
    const data = item.data()
    const courseId = Number(data.courseId)
    if (seen.has(courseId)) continue
    seen.add(courseId)
    marks.push({
      id: `legacy_${item.id}`,
      course_id: courseId,
      course_name: data.courseName || 'Course',
      city: data.city || '',
      country: data.country || 'New Zealand',
      marked_at: data.createdAt || data.datePlayed || null,
      user_id: data.userId
    })
  }

  return marks.sort((a, b) => String(b.marked_at || '').localeCompare(String(a.marked_at || '')))
}

export async function getMyPlayedCourses () {
  return getPlayedCoursesForUser(requireUid())
}

/** Detailed round log entries (date / rating / notes). */
export async function getPlayRoundsForUser (uid) {
  if (!uid) throw new Error('User id is required')
  const snap = await getDocs(
    query(collection(db, 'coursesPlayed'), where('userId', '==', uid))
  )

  return snap.docs
    .map(mapRound)
    .sort((a, b) => String(b.date_played).localeCompare(String(a.date_played)))
}

export async function getMyPlayRounds () {
  return getPlayRoundsForUser(requireUid())
}

export async function hasMarkedCourse (courseId) {
  const uid = auth.currentUser?.uid
  if (!uid) return false

  const markSnap = await getDoc(doc(db, 'playedCourses', markDocId(uid, courseId)))
  if (markSnap.exists()) return true

  const roundsSnap = await getDocs(
    query(collection(db, 'coursesPlayed'), where('userId', '==', uid))
  )
  return roundsSnap.docs.some((item) => Number(item.data().courseId) === Number(courseId))
}

export async function markCoursePlayed ({ courseId, courseName, city, country }) {
  const uid = requireUid()
  if (courseId == null) throw new Error('courseId is required')

  const id = markDocId(uid, courseId)
  const existing = await getDoc(doc(db, 'playedCourses', id))
  const payload = {
    userId: uid,
    courseId: Number(courseId),
    courseName: courseName || null,
    city: city || null,
    country: country || null,
    markedAt: existing.exists()
      ? (existing.data().markedAt || new Date().toISOString())
      : new Date().toISOString()
  }

  await setDoc(doc(db, 'playedCourses', id), payload, { merge: true })
  return mapMark({ id, data: () => payload })
}

export async function unmarkCoursePlayed (courseId) {
  const uid = requireUid()
  const roundsSnap = await getDocs(
    query(collection(db, 'coursesPlayed'), where('userId', '==', uid))
  )
  const hasRounds = roundsSnap.docs.some((item) => Number(item.data().courseId) === Number(courseId))
  if (hasRounds) {
    throw new Error('This course still has rounds in your play log. Remove those first to unmark it.')
  }

  await deleteDoc(doc(db, 'playedCourses', markDocId(uid, courseId)))
  return true
}

export async function addPlayRound ({
  courseId, datePlayed, rating, notes, courseName, city, country,
  score, holes, par, courseRating, slope, tee, holeScores, source
}) {
  const uid = requireUid()
  if (!courseId || !datePlayed) {
    throw new Error('courseId and datePlayed are required')
  }

  await markCoursePlayed({ courseId, courseName, city, country })

  const ref = await addDoc(collection(db, 'coursesPlayed'), {
    userId: uid,
    courseId: Number(courseId),
    courseName: courseName || null,
    city: city || null,
    country: country || null,
    datePlayed,
    rating: rating == null ? null : Number(rating),
    notes: notes || '',
    score: score == null ? null : Number(score),
    holes: holes == null ? null : Number(holes),
    par: par == null ? null : Number(par),
    courseRating: courseRating == null ? null : Number(courseRating),
    slope: slope == null ? null : Number(slope),
    tee: tee || null,
    holeScores: holeScores || null,
    source: source || 'form',
    createdAt: new Date().toISOString()
  })

  return {
    id: ref.id,
    course_id: Number(courseId),
    date_played: datePlayed,
    rating: rating == null ? null : Number(rating),
    notes: notes || '',
    score: score == null ? null : Number(score),
    holes: holes == null ? null : Number(holes)
  }
}

/** @deprecated Use addPlayRound — kept for older call sites. */
export async function markCoursePlayedWithRound (entry) {
  return addPlayRound(entry)
}

export async function deletePlayedEntry (id) {
  requireUid()
  await deleteDoc(doc(db, 'coursesPlayed', id))
  return true
}

export async function getCoursePlayedSummary (courseId) {
  const courseIdNumber = Number(courseId)
  const byUser = new Map()

  const marksSnap = await getDocs(
    query(collection(db, 'playedCourses'), where('courseId', '==', courseIdNumber))
  )
  for (const item of marksSnap.docs) {
    const data = item.data()
    byUser.set(data.userId, {
      id: item.id,
      user_id: data.userId,
      date_played: data.markedAt || null,
      rating: null,
      notes: ''
    })
  }

  // Include anyone who only has legacy/new rounds without a mark doc.
  const roundsSnap = await getDocs(
    query(collection(db, 'coursesPlayed'), where('courseId', '==', courseIdNumber))
  )
  for (const item of roundsSnap.docs) {
    const data = item.data()
    if (byUser.has(data.userId)) {
      const current = byUser.get(data.userId)
      // Prefer the most recent round details for friend cards when available.
      if (!current.date_played || String(data.datePlayed) > String(current.date_played)) {
        byUser.set(data.userId, {
          id: item.id,
          user_id: data.userId,
          date_played: data.datePlayed,
          rating: data.rating ?? null,
          notes: data.notes || ''
        })
      }
      continue
    }
    byUser.set(data.userId, {
      id: item.id,
      user_id: data.userId,
      date_played: data.datePlayed,
      rating: data.rating ?? null,
      notes: data.notes || ''
    })
  }

  return {
    count: byUser.size,
    entries: [...byUser.values()]
  }
}
