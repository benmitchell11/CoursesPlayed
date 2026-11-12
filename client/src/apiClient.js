import { getIdToken } from './services/auth'
import * as authService from './services/auth'
import * as playedService from './services/played'
import * as friendsService from './services/friends'
import * as forumService from './services/forum'
import * as usersService from './services/users'
import { getDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

const rootUrl = '/api/v1'

async function request (method, path, body) {
  const token = await getIdToken()
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${rootUrl}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    throw new Error(data?.error || `${method} ${path} failed with ${res.status}`)
  }

  return data
}

export function register (user) {
  return authService.register(user)
}

export function signIn (credentials) {
  return authService.signIn(credentials)
}

export function signOut () {
  return authService.signOut()
}

export function updateHandicap (handicap) {
  return authService.updateHandicap(handicap)
}

export function getCurrentUser () {
  // Kept for compatibility; UserContext now uses watchAuth.
  return Promise.reject(new Error('Use auth state watcher'))
}

export function searchCourses ({ search, country } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (country) params.set('country', country)
  const query = params.toString()
  return request('GET', `/courses${query ? `?${query}` : ''}`)
}

export function createCourse (course) {
  return request('POST', '/courses', course)
}

export function getCourse (id) {
  return request('GET', `/courses/${id}`)
}

export async function getCoursePlayedSummary (id) {
  const summary = await playedService.getCoursePlayedSummary(id)
  const friendIds = await friendsService.getAcceptedFriendIds()
  const friendSet = new Set(friendIds)

  const friends = []
  for (const entry of summary.entries || []) {
    if (!friendSet.has(entry.user_id)) continue
    const userSnap = await getDoc(doc(db, 'users', entry.user_id))
    friends.push({
      ...entry,
      username: userSnap.exists() ? userSnap.data().username : 'golfer'
    })
  }

  friends.sort((a, b) => String(b.date_played || '').localeCompare(String(a.date_played || '')))
  return { count: summary.count, friends }
}

export function getFriends () {
  return friendsService.getFriends()
}

export function sendFriendRequest (username) {
  return friendsService.sendFriendRequest(username)
}

export function acceptFriendRequest (id) {
  return friendsService.acceptFriendRequest(id)
}

export function getFriendshipStatus (otherUid) {
  return friendsService.getFriendshipStatus(otherUid)
}

export function searchUsers (term) {
  return usersService.searchUsers(term)
}

export function getUserByUsername (username) {
  return usersService.getUserByUsername(username)
}

export function getPlayedCoursesForUser (uid) {
  return playedService.getPlayedCoursesForUser(uid)
}

export function getPlayRoundsForUser (uid) {
  return playedService.getPlayRoundsForUser(uid)
}

export function getMyPlayedCourses () {
  return playedService.getMyPlayedCourses()
}

export function getMyPlayRounds () {
  return playedService.getMyPlayRounds()
}

export function hasMarkedCourse (courseId) {
  return playedService.hasMarkedCourse(courseId)
}

async function withCourseMeta (entry) {
  let courseMeta = {}
  if (entry.courseId != null) {
    try {
      const course = await getCourse(entry.courseId)
      courseMeta = {
        courseName: course.name,
        city: course.city,
        country: course.country
      }
    } catch {
      // Course lookup is best-effort for denormalised fields.
    }
  }
  return { ...entry, ...courseMeta }
}

export async function markCoursePlayed (entry) {
  return playedService.markCoursePlayed(await withCourseMeta(entry))
}

export async function unmarkCoursePlayed (courseId) {
  return playedService.unmarkCoursePlayed(courseId)
}

export async function addPlayRound (entry) {
  return playedService.addPlayRound(await withCourseMeta(entry))
}

export function deletePlayedEntry (id) {
  return playedService.deletePlayedEntry(id)
}

/** Turns a plain-English description of a round into a proposal. Saves nothing. */
export function parseRound (text) {
  return request('POST', '/rounds/parse', { text })
}

/** Reads a photo of a scorecard into a proposal. Saves nothing and keeps no photo. */
export function parseScorecard ({ image, mediaType }) {
  return request('POST', '/scorecards/parse', { image, mediaType })
}

/**
 * Asks the chatbot one message. Works signed out (public course questions) or signed in
 * (also personal ones). A personal question comes back as { needsData } naming which of
 * this file's own functions to call; call it and pass the result back as `context.data`
 * to get the final { reply } — see ChatWidget.jsx for the loop.
 *
 * `history` is the last few messages of this same conversation (so "what about Wellington
 * instead" can be understood) — it only lives in the browser tab's own memory, never saved
 * anywhere, and is gone on reload. Omit it on the `context` follow-up call; the server
 * already resolved what was being asked about on the first call.
 */
export function askChat (message, { context, history } = {}) {
  const body = { message }
  if (context) body.context = context
  if (history?.length) body.history = history
  return request('POST', '/chat', body)
}

export function getForumPosts () {
  return forumService.getForumPosts()
}

export function createForumPost (post) {
  return forumService.createForumPost(post)
}

export function getForumPost (id) {
  return forumService.getForumPost(id)
}

export function replyToForumPost (id, body) {
  return forumService.replyToForumPost(id, body)
}
