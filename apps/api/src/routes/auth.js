// POST /auth/instansi
// docs/API.md & docs/USERS.md: Verifikasi PIN instansi, terbitkan JWT 8 jam.
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'
import { config } from '../config.js'

export const auth = new Hono().post('/instansi', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const expectedPin = config.instansiPin || '2026'
  const secret = config.jwtSecret || 'dev-secret-civicpulse'

  if (!body.pin || body.pin !== expectedPin) {
    throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'PIN instansi salah.')
  }

  const payload = {
    peran: 'instansi',
    petugas: 'Petugas Demo · Dinas PUTR',
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 jam
  }

  const token = await sign(payload, secret, 'HS256')
  return c.json({ data: { token, petugas: payload.petugas } })
})
