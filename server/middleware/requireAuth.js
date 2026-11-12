const jwt = require('jsonwebtoken')
const { createRemoteJWKSet, jwtVerify } = require('jose')

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'courses-played'
const issuer = `https://securetoken.google.com/${PROJECT_ID}`
const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))

async function verifyFirebaseToken (token) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: PROJECT_ID
  })

  if (!payload.sub) {
    throw new Error('Invalid Firebase token payload')
  }

  return payload
}

function verifyLocalJwt (token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

function getBearerToken (req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme === 'Bearer' && token) return token
  return req.cookies?.token || null
}

function requireAuth (req, res, next) {
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  verifyFirebaseToken(token)
    .then((payload) => {
      req.userId = payload.sub
      req.userEmail = payload.email || null
      req.authProvider = 'firebase'
      next()
    })
    .catch(() => {
      try {
        const payload = verifyLocalJwt(token)
        req.userId = payload.id
        req.authProvider = 'local'
        next()
      } catch {
        res.status(401).json({ error: 'Invalid or expired session' })
      }
    })
}

module.exports = requireAuth
module.exports.verifyFirebaseToken = verifyFirebaseToken
