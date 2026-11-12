// Checks an uploaded photo before it goes anywhere near a model. The client sends
// a base64 string; nothing here trusts the claimed media type, only the bytes.

const MAX_BYTES = 5 * 1024 * 1024 // the model's own per-image limit

class ImageInputError extends Error {
  constructor (message, status = 400) {
    super(message)
    this.name = 'ImageInputError'
    this.status = status
  }
}

const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
}

// Accepts raw base64 or a data URL. Returns { data, mediaType, bytes }.
function checkImage ({ image, mediaType }) {
  if (typeof image !== 'string' || !image) throw new ImageInputError('Add a photo of your scorecard.')

  let base64 = image
  const dataUrl = /^data:([\w/+.-]+);base64,/.exec(image)
  if (dataUrl) {
    base64 = image.slice(dataUrl[0].length)
    mediaType = mediaType || dataUrl[1]
  }
  base64 = base64.replace(/\s+/g, '')

  if (!SIGNATURES[mediaType]) throw new ImageInputError('Use a JPEG, PNG or WebP photo.')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new ImageInputError('That photo could not be read.')

  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length > MAX_BYTES) throw new ImageInputError('That photo is too large. Try a smaller one.', 413)
  if (bytes.length < 12 || !SIGNATURES[mediaType](bytes)) {
    throw new ImageInputError('That file is not a valid image of the type it claims to be.')
  }

  return { data: base64, mediaType, bytes: bytes.length }
}

module.exports = { checkImage, ImageInputError, MAX_BYTES }
