// Sanitasi input string untuk mencegah Stored XSS dan karakter tak kasat mata
export function sanitasiTeks(input) {
  if (typeof input !== 'string') return input
  return input
    .replace(/[<>]/g, '') // strip tag HTML dasar
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      // Allow tab (9), newline (10), carriage return (13), and printable chars >= 32
      return code === 9 || code === 10 || code === 13 || code >= 32
    })
    .join('')
    .trim()
}

export function sanitasiObjek(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitasiObjek)

  const hasil = {}
  for (const [kunci, nilai] of Object.entries(obj)) {
    if (typeof nilai === 'string') {
      hasil[kunci] = sanitasiTeks(nilai)
    } else if (typeof nilai === 'object' && nilai !== null) {
      hasil[kunci] = sanitasiObjek(nilai)
    } else {
      hasil[kunci] = nilai
    }
  }
  return hasil
}
