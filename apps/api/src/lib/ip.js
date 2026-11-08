// IP klien untuk batas laju. X-Forwarded-For hanya dipercaya bila config.percayaProxy (di belakang proxy tepercaya);
// selain itu header bisa dipalsukan penyerang, jadi dipakai alamat koneksi TCP.
import { getConnInfo } from '@hono/node-server/conninfo'
import { config } from '../config.js'

export function ipKlien(c) {
  if (config.percayaProxy) {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip')
    if (ip) return ip
  }
  try {
    return getConnInfo(c).remote.address || 'tanpa-ip'
  } catch {
    return 'tanpa-ip' // runtime tanpa info koneksi (mis. tes app.request)
  }
}
