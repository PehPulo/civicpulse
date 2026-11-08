// PEMILIK: Ezra (AI) · KONTRAK: docs/API.md § AI · Ditinjau: Albert
//
// POST /ai/ringkasan-dasbor   body: { bahan }  (keluaran bahanDasbor(): HANYA angka & id wilayah)
//   200 { data: { ringkasan: string|null, sumber: 'ai'|'template', alasan?, model?, cache } }
//   429 bila IP terlalu sering meminta.
// ringkasan null ⇒ frontend memakai ringkasan template (berbasis aturan). Aplikasi tidak pernah rusak karena LLM.
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { GalatDomain, KODE_GALAT, faktaDasbor, keluaranAman, validasiBahanDasbor } from '@civicpulse/core'
import wilayahData from '@civicpulse/data/wilayah.json' with { type: 'json' }
import { config } from '../config.js'
import { tulisRingkasan } from '../ai/groq.js'
import { buatBatasLaju, buatCache, buatPlafonHarian } from '../ai/penjaga.js'

const PERKIRAAN_TOKEN = 800 // per panggilan (±660 terukur di ml/reports), dibulatkan ke atas
const W = wilayahData.wilayah

export function buatRuteAi({ apiKey = config.groqApiKey, ai = config.ai, tulis = tulisRingkasan } = {}) {
  const boleh = buatBatasLaju({ maks: ai.batasPerMenitPerIp })
  const plafon = buatPlafonHarian(ai.batasTokenHarian)
  // Simpan hasil AI & hasil yang ditolak pengaman; galat sementara (jaringan/kuota) tidak di-cache.
  const cache = buatCache({
    ttlMs: ai.cacheMenit * 60_000,
    simpan: (h) => h.sumber === 'ai' || h.alasan === 'ditolak-pengaman',
  })

  const ipDari = (c) => c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || 'tanpa-ip'

  return new Hono().post(
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
}
