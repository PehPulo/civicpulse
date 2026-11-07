// Rate limiter in-memory berbasis IP (Sliding Window sederahana)
// Melindungi backend dari serangan bot DDoS dan request flooding.
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'

export function buatRateLimiter({ batas = 100, jendelaMs = 60 * 1000 } = {}) {
  const catatan = new Map()

  // Garbage collection otomatis setiap 5 menit
  setInterval(
    () => {
      const sekarang = Date.now()
      for (const [ip, data] of catatan.entries()) {
        if (sekarang - data.resetAt > jendelaMs) {
          catatan.delete(ip)
        }
      }
    },
    5 * 60 * 1000,
  ).unref?.()

  return async function rateLimiter(c, next) {
    // Lewatkan health check dan docs agar tidak mengganggu monitoring / inspeksi UI
    const path = c.req.path
    if (path.endsWith('/health') || path.includes('/docs') || path.includes('/openapi.json')) {
      return next()
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || '127.0.0.1'

    const sekarang = Date.now()
    let data = catatan.get(ip)

    if (!data || sekarang > data.resetAt) {
      data = { hitung: 1, resetAt: sekarang + jendelaMs }
      catatan.set(ip, data)
    } else {
      data.hitung += 1
    }

    const sisa = Math.max(0, batas - data.hitung)
    c.header('X-RateLimit-Limit', String(batas))
    c.header('X-RateLimit-Remaining', String(sisa))
    c.header('X-RateLimit-Reset', String(Math.ceil(data.resetAt / 1000)))

    if (data.hitung > batas) {
      throw new GalatDomain(
        KODE_GALAT.BATAS_HARIAN,
        'Terlalu banyak permintaan dari IP Anda. Silakan coba beberapa saat lagi.',
        { batas, resetDalamDetik: Math.ceil((data.resetAt - sekarang) / 1000) },
      )
    }

    await next()
  }
}
