// Pengaman tambahan saat integrasi: anti tebak PIN, header IP palsu, header keamanan, rahasia produksi.
import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { tanganiGalat } from '../src/middleware/galat.js'
import { buatRuteAuth } from '../src/routes/auth.js'
import { buatApp } from '../src/app.js'

const appAuth = (batas) => {
  const a = new Hono()
  a.onError(tanganiGalat)
  a.route('/auth', buatRuteAuth({ batas }))
  return a
}
const login = (a, pin, ip = '1.1.1.1') =>
  a.request('/auth/instansi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ pin }),
  })

describe('keamanan API', () => {
  it('PIN benar menerbitkan token, PIN salah 401, bukan-string 401', async () => {
    const a = appAuth(10)
    expect((await login(a, '2026')).status).toBe(200)
    expect((await login(a, '0000')).status).toBe(401)
    expect((await login(a, 2026)).status).toBe(401)
  })

  it('tebak PIN dibatasi, dan X-Forwarded-For palsu tidak bisa mengakalinya', async () => {
    const a = appAuth(3)
    for (let i = 0; i < 3; i++) expect((await login(a, '000' + i, `9.9.9.${i}`)).status).toBe(401)
    // IP "berbeda" di header tetap dianggap klien yang sama (proxy tidak dipercaya di dev)
    expect((await login(a, '2026', '8.8.8.8')).status).toBe(429)
  })

  it('header keamanan terpasang dan token palsu ditolak', async () => {
    const app = buatApp()
    const r = await app.request('/api/v1/health')
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
    expect(r.headers.get('x-frame-options')).toBe('DENY')
    const palsu = await app.request('/api/v1/laporan/CP-2026-0001/status', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJwZXJhbiI6Imluc3RhbnNpIn0.x',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ke: 'diproses' }),
    })
    expect(palsu.status).toBe(401)
  })
})
