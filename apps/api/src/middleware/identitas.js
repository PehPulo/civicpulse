// docs/USERS.md: warga diidentifikasi X-Device-Id (UUID), instansi dengan Bearer token.
import { verify } from 'hono/jwt'
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'
import { config } from '../config.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const wajibWarga = async (c, next) => {
  const id = c.req.header('X-Device-Id')
  if (!id || !UUID.test(id)) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Header X-Device-Id (UUID) wajib ada.')
  c.set('deviceId', id)
  await next()
}

export const opsionalWarga = async (c, next) => {
  const id = c.req.header('X-Device-Id')
  if (id && UUID.test(id)) {
    c.set('deviceId', id)
  }
  await next()
}

export const wajibInstansi = async (c, next) => {
  const header = c.req.header('Authorization')
  const token = header?.replace(/^Bearer\s+/i, '')
  if (!token) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Token instansi wajib ada.')

  const secret = config.jwtSecret
  try {
    const payload = await verify(token, secret, 'HS256')
    if (payload.peran !== 'instansi') {
      throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Token tidak memiliki hak akses instansi.')
    }
    c.set('instansi', payload)
    // Yurisdiksi dari token. Token lama tanpa tingkat ⇒ admin kab/kota Kota Bandung.
    c.set('akses', {
      tingkat: payload.tingkat ?? 'kabkota',
      provinsiId: payload.provinsiId ?? (payload.tingkat ? null : 'jawa-barat'),
      kabkotaId: payload.kabkotaId ?? (payload.tingkat ? null : 'kota-bandung'),
    })
    await next()
  } catch (e) {
    if (e instanceof GalatDomain) throw e
    throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Token instansi tidak valid atau kedaluwarsa.')
  }
}
