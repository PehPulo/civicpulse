// docs/USERS.md: warga diidentifikasi X-Device-Id (UUID), instansi dengan Bearer token.
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const wajibWarga = async (c, next) => {
  const id = c.req.header('X-Device-Id')
  if (!id || !UUID.test(id)) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Header X-Device-Id (UUID) wajib ada.')
  c.set('deviceId', id)
  await next()
}

// TODO(Albert): verifikasi JWT (config.jwtSecret) dari POST /auth/instansi.
export const wajibInstansi = async (c, next) => {
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Token instansi wajib ada.')
  c.set('instansi', { token })
  await next()
}
