// PEMILIK: Ezra (AI) · KONTRAK: docs/API.md § AI · Ditinjau: Albert
//
// POST /ai/ringkasan-dasbor   body: { bahan }  (keluaran bahanDasbor(): HANYA angka & id wilayah)
//   200 { data: { ringkasan: string|null, sumber: 'ai'|'template', alasan?, model?, cache } }
//   429 bila IP terlalu sering meminta.
// ringkasan null ⇒ frontend memakai ringkasan template (berbasis aturan). Aplikasi tidak pernah rusak karena LLM.
//
// POST /ai/foto   multipart: file (JPEG/PNG/WebP ≤ 1,5 MB), tugas ('klasifikasi'|'detail'|'verifikasi'), kategoriId?
//   200 { data: <hasil computer vision> }  ·  400 bila tidak valid  ·  429 bila IP terlalu sering  ·  503 bila sibuk
// Foto diproses di memori lalu dibuang (tidak disimpan). Perangkat warga tidak mengunduh model apa pun.
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { GalatDomain, KODE_GALAT, faktaDasbor, keluaranAman, validasiBahanDasbor } from '@civicpulse/core'
import wilayahData from '@civicpulse/data/wilayah.json' with { type: 'json' }
import { config } from '../config.js'
import { tulisRingkasan } from '../ai/groq.js'
import { buatAntrean, buatBatasLaju, buatCache, buatPlafonHarian } from '../ai/penjaga.js'
import * as visionAsli from '../ai/vision.js'
import { ipKlien } from '../lib/ip.js'

const PERKIRAAN_TOKEN = 800 // per panggilan (±660 terukur di ml/reports), dibulatkan ke atas
const W = wilayahData.wilayah
const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp']
const MAKS_FOTO = 1.5 * 1024 * 1024
const TUGAS_FOTO = ['klasifikasi', 'detail', 'verifikasi']

export function buatRuteAi({
  apiKey = config.groqApiKey,
  ai = config.ai,
  tulis = tulisRingkasan,
  vision = visionAsli,
} = {}) {
  const boleh = buatBatasLaju({ maks: ai.batasPerMenitPerIp })
  const bolehFoto = buatBatasLaju({ maks: ai.batasFotoPerMenitPerIp ?? 30 })
  const antrean = buatAntrean({ bersamaan: 2, maksAntre: 20 })
  const plafon = buatPlafonHarian(ai.batasTokenHarian)
  // Simpan hasil AI & hasil yang ditolak pengaman; galat sementara (jaringan/kuota) tidak di-cache.
  const cache = buatCache({
    ttlMs: ai.cacheMenit * 60_000,
    simpan: (h) => h.sumber === 'ai' || h.alasan === 'ditolak-pengaman',
  })

  const ipDari = ipKlien

  const app = new Hono()

  app.post(
    '/ringkasan-dasbor',
    bodyLimit({
      maxSize: 2 * 1024,
      onError: () => {
        throw new GalatDomain(KODE_GALAT.VALIDASI, 'Permintaan terlalu besar.')
      },
    }),
    async (c) => {
      // 1. Batas per IP dulu, agar spam (termasuk yang tidak valid) tidak membebani server.
      if (!boleh(ipDari(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering meminta ringkasan. Coba lagi sebentar.')

      // 2. Validasi ketat: hanya angka & id wilayah resmi. Fakta disusun SERVER, bukan klien.
      const body = await c.req.json().catch(() => null)
      const bahan = validasiBahanDasbor(body?.bahan, W)
      const fakta = faktaDasbor(bahan, W)

      if (!apiKey) return c.json({ data: { ringkasan: null, sumber: 'template', alasan: 'ai-mati', cache: false } })

      // 3. Cache bersama: fakta sama ⇒ satu panggilan untuk semua pengunjung (dan permintaan kembar digabung).
      const hasil = await cache(fakta, async () => {
        if (!plafon.cukup(PERKIRAAN_TOKEN)) return { ringkasan: null, sumber: 'template', alasan: 'plafon-harian' }
        try {
          const r = await tulis(fakta, { apiKey })
          plafon.catat(r.token || PERKIRAAN_TOKEN)
          // 4. Pengaman: angka harus ada di fakta & teks tidak rusak; bila gagal ⇒ template.
          return keluaranAman(r.teks, fakta)
            ? { ringkasan: r.teks, sumber: 'ai', model: r.model }
            : { ringkasan: null, sumber: 'template', alasan: 'ditolak-pengaman' }
        } catch (e) {
          console.warn('[ai] Groq gagal:', e.message)
          return { ringkasan: null, sumber: 'template', alasan: e.status === 429 ? 'kuota-groq' : 'gagal' }
        }
      })
      return c.json({ data: hasil })
    },
  )

  app.post(
    '/foto',
    bodyLimit({
      maxSize: 2 * 1024 * 1024,
      onError: () => {
        throw new GalatDomain(KODE_GALAT.VALIDASI, 'Foto terlalu besar (maks. 1,5 MB).')
      },
    }),
    async (c) => {
      if (!bolehFoto(ipDari(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering mengirim foto. Coba lagi sebentar.')

      const form = await c.req.parseBody().catch(() => ({}))
      const { file, tugas, kategoriId } = form
      if (!(file instanceof File) || !TIPE_FOTO.includes(file.type) || file.size === 0 || file.size > MAKS_FOTO)
        throw new GalatDomain(KODE_GALAT.VALIDASI, 'Foto harus JPEG/PNG/WebP, maks. 1,5 MB.')
      if (!TUGAS_FOTO.includes(tugas)) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Tugas AI foto tidak dikenal.')
      if (tugas !== 'klasifikasi' && !vision.KATEGORI_VISION.includes(kategoriId))
        throw new GalatDomain(KODE_GALAT.VALIDASI, 'Kategori tidak dikenal.')

      const buffer = await file.arrayBuffer()
      try {
        const hasil = await antrean(() =>
          tugas === 'klasifikasi'
            ? vision.klasifikasi(buffer, file.type)
            : tugas === 'detail'
              ? vision.detail(buffer, file.type, kategoriId)
              : vision.verifikasi(buffer, file.type, kategoriId),
        )
        return c.json({ data: hasil })
      } catch (e) {
        if (e.kode === 'SIBUK') return c.json({ error: { kode: 'SIBUK', pesan: e.message } }, 503)
        console.warn('[ai] vision gagal:', e.message)
        throw new GalatDomain(KODE_GALAT.VALIDASI, 'Foto tidak bisa dibaca.')
      }
    },
  )

  return app
}
