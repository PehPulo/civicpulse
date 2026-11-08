// Tes endpoint AI khusus petugas: wajib token, fakta dari server, pengaman angka & tautan, meteran pemakaian.
import { describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { STATUS, buatSeed } from '@civicpulse/core'
import wilayahData from '@civicpulse/data/wilayah.json' with { type: 'json' }
import { config } from '../src/config.js'
import { tanganiGalat } from '../src/middleware/galat.js'
import { buatRuteAi } from '../src/routes/ai.js'

const W = wilayahData.wilayah
const T0 = Date.parse('2026-11-07T08:00:00.000Z')
const SEED = buatSeed(W, T0)
const repo = {
  semua: async () => SEED,
  cari: async (k) => SEED.find((l) => l.kode === k) ?? null,
}
const diterima = SEED.find((l) => l.status === STATUS.DITERIMA)

const token = () =>
  sign({ peran: 'instansi', petugas: 'Uji', exp: Math.floor(Date.now() / 1000) + 600 }, config.jwtSecret)

function buat({ teks, apiKey = 'uji' } = {}) {
  const tulisPrompt = vi.fn(async (fakta) => ({
    teks: teks ?? fakta.split('\n')[0].replace(':', ' adalah').trim() + ' Mohon tim memprioritaskan yang mendesak.',
    token: 500,
    model: 'uji-model',
  }))
  const app = new Hono().onError(tanganiGalat)
  app.route(
    '/ai',
    buatRuteAi({
      apiKey,
      ai: { batasPerMenitPerIp: 5, batasPetugasPerMenit: 3, batasTokenHarian: 150000, cacheMenit: 15 },
      tulisPrompt,
      repo,
      vision: { VISION: 'uji-vision', KATEGORI_VISION: [] },
      sekarang: () => new Date(T0).toISOString(),
    }),
  )
  const kirim = async (path, { body, auth = true, method = 'POST' } = {}) =>
    app.request(`/ai${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && { Authorization: `Bearer ${await token()}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  return { kirim, tulisPrompt }
}

describe('AI petugas', () => {
  it('tanpa token ⇒ 401 untuk semua endpoint petugas', async () => {
    const { kirim } = buat()
    expect((await kirim('/briefing-antrean', { auth: false })).status).toBe(401)
    expect(
      (await kirim('/draf-tanggapan', { auth: false, body: { kode: diterima.kode, ke: 'diproses' } })).status,
    ).toBe(401)
    expect((await kirim('/pemakaian', { auth: false, method: 'GET' })).status).toBe(401)
  })

  it('briefing: fakta & ringkasan dihitung server, teks lolos pengaman, kedua kali dari cache', async () => {
    const { kirim, tulisPrompt } = buat()
    const a = (await (await kirim('/briefing-antrean')).json()).data
    expect(a.sumber).toBe('ai')
    expect(a.fakta).toContain(`Laporan terbuka: ${a.ringkasan.terbuka}`)
    expect(a.ringkasan.total).toBe(SEED.length)
    const b = (await (await kirim('/briefing-antrean')).json()).data
    expect(b.cache).toBe(true)
    expect(tulisPrompt).toHaveBeenCalledTimes(1)
  })

  it('briefing yang mengarang angka ditolak pengaman', async () => {
    const { kirim } = buat({ teks: 'Ada 987 laporan terbuka dan semuanya harus selesai hari ini juga ya tim.' })
    const d = (await (await kirim('/briefing-antrean')).json()).data
    expect(d).toMatchObject({ briefing: null, sumber: 'template', alasan: 'ditolak-pengaman' })
  })

  it('draf tanggapan: transisi harus sah, tautan ditolak, deskripsi warga tidak dikirim ke LLM', async () => {
    const { kirim, tulisPrompt } = buat()
    expect((await kirim('/draf-tanggapan', { body: { kode: diterima.kode, ke: 'terverifikasi' } })).status).toBe(400)
    expect((await kirim('/draf-tanggapan', { body: { kode: 'CP-0000-0000', ke: 'diproses' } })).status).toBe(404)
    const ok = (await (await kirim('/draf-tanggapan', { body: { kode: diterima.kode, ke: 'diproses' } })).json()).data
    expect(ok.sumber).toBe('ai')
    expect(tulisPrompt.mock.calls[0][0]).not.toContain(diterima.deskripsi)

    const { kirim: kirim2 } = buat({ teks: 'Info lengkap ada di https://palsu.id ya, terima kasih atas laporannya.' })
    const t = (await (await kirim2('/draf-tanggapan', { body: { kode: diterima.kode, ke: 'diproses' } })).json()).data
    expect(t).toMatchObject({ draf: null, alasan: 'ditolak-pengaman' })
  })

  it('batas laju petugas & meteran pemakaian menghitung token, panggilan, dan cache', async () => {
    const { kirim } = buat()
    await kirim('/briefing-antrean')
    await kirim('/briefing-antrean')
    await kirim('/briefing-antrean')
    expect((await kirim('/briefing-antrean')).status).toBe(429)
    const m = (await (await kirim('/pemakaian', { method: 'GET' })).json()).data
    expect(m.llm).toMatchObject({ panggilan: 1, token: 500, cache: 2, aktif: true, sisaToken: 149500 })
    expect(m.vision.model).toBe('uji-vision')
  })

  it('tanpa kunci Groq ⇒ template, tetap mengembalikan fakta hitungan', async () => {
    const { kirim, tulisPrompt } = buat({ apiKey: null })
    const d = (await (await kirim('/briefing-antrean')).json()).data
    expect(d).toMatchObject({ briefing: null, alasan: 'ai-mati' })
    expect(d.ringkasan.terbuka).toBeGreaterThan(0)
    expect(tulisPrompt).not.toHaveBeenCalled()
  })
})
