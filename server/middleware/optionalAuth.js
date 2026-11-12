const jwt = require('jsonwebtoken')
const { verifyFirebaseToken } = require('./requireAuth')

function getBearerToken (req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme === 'Bearer' && token) return token
  return req.cookies?.token || null
}

function optionalAuth (req, res, next) {
  const token = getBearerToken(req)
  if (!token) {
    req.userId = null
    return next()
  }

  verifyFirebaseToken(token)
    .then((payload) => {
      req.userId = payload.sub
      req.userEmail = payload.email || null
      next()
    })
    .catch(() => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = payload.id
        next()
      } catch {
        req.userId = null
        next()
      }
    })
}

module.exports = optionalAuth
