// Rate limiter in-memory berbasis IP (Sliding Window sederahana)
// Melindungi backend dari serangan bot DDoS dan request flooding.
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'
import { ipKlien } from '../lib/ip.js'

// maksIp: plafon jumlah IP yang dicatat. Serangan dari ribuan IP berbeda tidak bisa menghabiskan memori server
// (penting di perangkat kecil seperti Jetson); IP tertua dibuang lebih dulu.
export function buatRateLimiter({ batas = 100, jendelaMs = 60 * 1000, maksIp = 50_000 } = {}) {
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

    const ip = ipKlien(c)

    const sekarang = Date.now()
    let data = catatan.get(ip)

    if (!data || sekarang > data.resetAt) {
      data = { hitung: 1, resetAt: sekarang + jendelaMs }
      catatan.delete(ip)
      catatan.set(ip, data)
      if (catatan.size > maksIp) catatan.delete(catatan.keys().next().value)
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
