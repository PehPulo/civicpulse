// Pengaman tambahan saat integrasi: anti tebak password, header IP palsu, header keamanan, rahasia produksi.
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
const login = (a, password, ip = '1.1.1.1', username = 'admin.kota-bandung') =>
  a.request('/auth/instansi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ username, password }),
  })

describe('keamanan API', () => {
  it('akun benar menerbitkan token; password salah, username asing, atau bukan-string 401 dengan pesan sama', async () => {
    const a = appAuth(10)
    expect((await login(a, 'civicpulse2026')).status).toBe(200)
    const salah = await login(a, 'tebakan123')
    const asing = await login(a, 'civicpulse2026', '1.1.1.1', 'admin.tidak-ada')
    expect(salah.status).toBe(401)
    expect(asing.status).toBe(401)
    expect((await salah.json()).error.pesan).toBe((await asing.json()).error.pesan)
    expect((await login(a, 2026)).status).toBe(401)
  })

  it('tebak password dibatasi, dan X-Forwarded-For palsu tidak bisa mengakalinya', async () => {
    const a = appAuth(3)
    for (let i = 0; i < 3; i++) expect((await login(a, 'tebak' + i, `9.9.9.${i}`)).status).toBe(401)
    // IP "berbeda" di header tetap dianggap klien yang sama (proxy tidak dipercaya di dev)
    expect((await login(a, 'civicpulse2026', '8.8.8.8')).status).toBe(429)
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
