// Tes akun admin: login username+password, ganti password, profil tersimpan di akun, daftar admin bawahan per tingkat.
import { beforeEach, describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { tanganiGalat } from '../src/middleware/galat.js'
import { buatRuteAuth } from '../src/routes/auth.js'
import * as repoAkun from '../src/repositories/akun.js'

const DEMO = 'civicpulse2026'
const repoLaporan = { semua: async () => [] }

function buat() {
  const a = new Hono().onError(tanganiGalat)
  a.route('/auth', buatRuteAuth({ batas: 100, repoLaporan }))
  const kirim = (path, { body, token, method = 'POST' } = {}) =>
    a.request(`/auth${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    })
  const masuk = async (username, password = DEMO) =>
    (await (await kirim('/instansi', { body: { username, password } })).json()).data
  return { kirim, masuk }
}

describe('akun admin instansi', () => {
  beforeEach(() => repoAkun._reset(DEMO))

  it('login menerbitkan token dengan yurisdiksi akun; username dirapikan (huruf kecil, spasi)', async () => {
    const { masuk } = buat()
    const s = await masuk('  ADMIN.Jawa-Barat ')
    expect(s).toMatchObject({ username: 'admin.jawa-barat', tingkat: 'provinsi', provinsiId: 'jawa-barat' })
    expect(s.token).toBeTruthy()
    const p = await masuk('admin.pusat')
    expect(p).toMatchObject({ tingkat: 'pusat', provinsiId: null })
  })

  it('ganti password: password lama salah 401, password lemah 400, lalu hanya password baru yang berlaku', async () => {
    const { kirim, masuk } = buat()
    const { token } = await masuk('admin.kota-bandung')
    expect((await kirim('/sandi', { token, body: { lama: 'salah', baru: 'BaruSekali99' } })).status).toBe(401)
    expect((await kirim('/sandi', { token, body: { lama: DEMO, baru: 'pendek' } })).status).toBe(400)
    expect((await kirim('/sandi', { token, body: { lama: DEMO, baru: 'tanpaangka' } })).status).toBe(400)
    expect((await kirim('/sandi', { token, body: { lama: DEMO, baru: 'BaruSekali99' } })).status).toBe(200)
    expect(await masuk('admin.kota-bandung', DEMO)).toBeUndefined()
    expect((await masuk('admin.kota-bandung', 'BaruSekali99')).sandiDiganti).toBe(true)
    // akun lain tetap memakai password demo
    expect((await masuk('admin.bandung')).token).toBeTruthy()
  })

  it('profil tersimpan di akun sehingga terlihat oleh atasan', async () => {
    const { kirim, masuk } = buat()
    const { token } = await masuk('admin.kota-bandung')
    const r = await kirim('/profil', { token, body: { nama: 'Rina Wulandari', unit: 'Dinas PUPR Kota Bandung' } })
    expect((await r.json()).data.petugas).toBe('Rina Wulandari · Dinas PUPR Kota Bandung')
    const prov = await masuk('admin.jawa-barat')
    const daftar = (await (await kirim('/admin', { token: prov.token, method: 'GET' })).json()).data
    const bdg = daftar.find((a) => a.username === 'admin.kota-bandung')
    expect(bdg).toMatchObject({ nama: 'Rina Wulandari', unit: 'Dinas PUPR Kota Bandung' })
    expect(bdg.terakhirMasuk).toBeTruthy()
    expect(bdg).not.toHaveProperty('hash')
    expect(bdg).not.toHaveProperty('salt')
    expect(bdg.beban).toMatchObject({ total: 0, terbuka: 0 })
  })

  it('daftar admin: provinsi melihat kab/kota-nya saja, pusat melihat provinsi (bisa telusur), kab/kota 403', async () => {
    const { kirim, masuk } = buat()
    const lihat = async (u, q = '') => kirim(`/admin${q}`, { token: (await masuk(u)).token, method: 'GET' })
    const prov = (await (await lihat('admin.jawa-barat')).json()).data
    expect(prov.length).toBeGreaterThan(0)
    expect(prov.every((a) => a.tingkat === 'kabkota' && a.provinsiId === 'jawa-barat')).toBe(true)
    // provinsi tidak bisa mengintip provinsi lain lewat query
    const intip = (await (await lihat('admin.jawa-barat', '?provinsiId=jawa-timur')).json()).data
    expect(intip.every((a) => a.provinsiId === 'jawa-barat')).toBe(true)
    const pusat = (await (await lihat('admin.pusat')).json()).data
    expect(pusat.every((a) => a.tingkat === 'provinsi')).toBe(true)
    const telusur = (await (await lihat('admin.pusat', '?provinsiId=jawa-timur')).json()).data
    expect(telusur.every((a) => a.tingkat === 'kabkota' && a.provinsiId === 'jawa-timur')).toBe(true)
    expect((await lihat('admin.kota-bandung')).status).toBe(403)
  })

  it('token lama tanpa username diminta masuk ulang', async () => {
    const { kirim } = buat()
    const { sign } = await import('hono/jwt')
    const { config } = await import('../src/config.js')
    const lama = await sign(
      { peran: 'instansi', tingkat: 'kabkota', kabkotaId: 'kota-bandung', exp: Math.floor(Date.now() / 1000) + 600 },
      config.jwtSecret,
    )
    expect((await kirim('/sandi', { token: lama, body: { lama: DEMO, baru: 'BaruSekali99' } })).status).toBe(401)
  })
})
