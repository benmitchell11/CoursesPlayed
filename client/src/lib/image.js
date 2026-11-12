// Shrinks a phone photo before it is uploaded. A 12-megapixel camera JPEG is
// several MB; the model reads a card fine at 1568px on the long edge, and the
// server rejects anything over 5MB anyway.

const MAX_EDGE = 1568
const QUALITY = 0.85

export async function photoToJpeg (file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose a photo.')

  // 'from-image' applies the camera's rotation so a portrait photo is not sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob) throw new Error('That photo could not be read.')

  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return { image: btoa(binary), mediaType: 'image/jpeg' }
}
