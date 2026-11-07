// Kompres foto di browser sebelum disimpan/diunggah: sisi terpanjang 960 px, JPEG 0.72.
// Menggambar ulang ke canvas sekaligus MEMBUANG seluruh metadata EXIF (privasi, docs/DEVOPS.md § Keamanan).
export async function kompresFoto(file, { sisiMaks = 960, kualitas = 0.72 } = {}) {
  const bitmap = await createImageBitmap(file)
  const skala = Math.min(1, sisiMaks / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * skala)
  canvas.height = Math.round(bitmap.height * skala)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', kualitas)
}

// Waktu pengambilan foto. MVP: lastModified file; versi lanjut membaca EXIF DateTimeOriginal (docs/AI.md § EXIF).
export const waktuFoto = (file) => new Date(file.lastModified || Date.now()).toISOString()
