// PEMILIK: Ezra (AI) · KONTRAK: docs/API.md § AI · Ditinjau: Albert
//
// POST /ai/ringkasan-dasbor   body: { bahan }  (keluaran bahanDasbor(): HANYA angka & id wilayah)
//   200 { data: { ringkasan: string|null, sumber: 'ai'|'template', alasan?, model?, cache } }
//   429 bila IP terlalu sering meminta.
// ringkasan null ⇒ frontend memakai ringkasan template (berbasis aturan). Aplikasi tidak pernah rusak karena LLM.
//
// POST /ai/foto   multipart: file (JPEG/PNG/WebP ≤ 1,5 MB), tugas ('klasifikasi'|'detail'|'verifikasi'), kategoriId?
//   200 { data: <hasil computer vision> & { ms } }  ·  400 tidak valid  ·  429 terlalu sering  ·  503 sibuk
// Foto diproses di memori lalu dibuang (tidak disimpan). Perangkat warga tidak mengunduh model apa pun.
//
// ── Khusus petugas (Bearer token instansi) ──
// POST /ai/briefing-antrean   tanpa body; fakta dihitung server dari SELURUH data antrean (tanpa input klien)
//   200 { data: { briefing: string|null, sumber, alasan?, model?, prompt, fakta, ringkasan, cache } }
// POST /ai/draf-tanggapan     body: { kode, ke, catatan? } ⇒ draf tanggapan publik; petugas menyunting & menyetujui
//   200 { data: { draf: string|null, sumber, alasan?, model?, prompt, cache } }
// GET  /ai/pemakaian          meteran hari ini: token LLM vs plafon, panggilan, cache, ditolak, analisis foto, waktu rata-rata
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import {
  GalatDomain,
  KODE_GALAT,
  PERAN,
  bisaTransisi,
  faktaBriefing,
  faktaDasbor,
  faktaTanggapan,
  keluaranAman,
  ringkasanAntrean,
  tampilanPublik,
  tanggapanWajar,
  validasiBahanDasbor,
} from '@civicpulse/core'
import wilayahData from '@civicpulse/data/wilayah.json' with { type: 'json' }
import { config } from '../config.js'
import { konfigLlm, tulisDenganPrompt, tulisRingkasan } from '../ai/groq.js'
import { PROMPT_BRIEFING, PROMPT_TANGGAPAN } from '../ai/prompt-instansi.js'
import { buatAntrean, buatBatasLaju, buatCache, buatPlafonHarian } from '../ai/penjaga.js'
import * as visionAsli from '../ai/vision.js'
import { ipKlien } from '../lib/ip.js'
import { wajibInstansi } from '../middleware/identitas.js'
import * as repoAsli from '../repositories/laporan.js'

const PERKIRAAN_TOKEN = 800 // per panggilan (±660 terukur di ml/reports), dibulatkan ke atas
const W = wilayahData.wilayah
const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp']
const MAKS_FOTO = 1.5 * 1024 * 1024
const TUGAS_FOTO = ['klasifikasi', 'detail', 'verifikasi']

const batasBody = (maxSize, pesan = 'Permintaan terlalu besar.') =>
  bodyLimit({
    maxSize,
    onError: () => {
      throw new GalatDomain(KODE_GALAT.VALIDASI, pesan)
    },
  })

export function buatRuteAi({
  apiKey = config.groqApiKey,
  ai = config.ai,
  tulis = tulisRingkasan,
  tulisPrompt = tulisDenganPrompt,
  vision = visionAsli,
  repo = repoAsli,
  sekarang = () => new Date().toISOString(),
} = {}) {
  const boleh = buatBatasLaju({ maks: ai.batasPerMenitPerIp })
  const bolehFoto = buatBatasLaju({ maks: ai.batasFotoPerMenitPerIp ?? 30 })
  const bolehPetugas = buatBatasLaju({ maks: ai.batasPetugasPerMenit ?? 20 })
  const antrean = buatAntrean({ bersamaan: 2, maksAntre: 20 })
  const plafon = buatPlafonHarian(ai.batasTokenHarian) // dipakai bersama SEMUA fitur LLM
  // Simpan hasil AI & hasil yang ditolak pengaman; galat sementara (jaringan/kuota) tidak di-cache.
  const cache = buatCache({
    ttlMs: ai.cacheMenit * 60_000,
    simpan: (h) => h.sumber === 'ai' || h.alasan === 'ditolak-pengaman',
  })
  const ipDari = ipKlien

  // Meteran pemakaian (dihitung server, reset tiap hari UTC) ⇒ ditampilkan di panel petugas.
  const meterKosong = () => ({
    llm: { panggilan: 0, token: 0, cache: 0, ditolak: 0, gagal: 0 },
    vision: { analisis: 0, ms: 0 },
  })
  let hariMeter = ''
  let meter = meterKosong()
  const segarkanMeter = () => {
    const h = new Date().toISOString().slice(0, 10)
    if (h !== hariMeter) {
      hariMeter = h
      meter = meterKosong()
    }
  }

  /** Satu jalur LLM untuk semua fitur: plafon harian → panggil → catat token → pengaman → meteran. */
  async function jalankanLlm(fakta, panggil, wajar = () => true) {
    segarkanMeter()
    if (!plafon.cukup(PERKIRAAN_TOKEN)) return { teks: null, sumber: 'template', alasan: 'plafon-harian' }
    try {
      const r = await panggil()
      const token = r.token || PERKIRAAN_TOKEN
      plafon.catat(token)
      meter.llm.panggilan += 1
      meter.llm.token += token
      if (keluaranAman(r.teks, fakta) && wajar(r.teks)) return { teks: r.teks, sumber: 'ai', model: r.model }
      meter.llm.ditolak += 1
      return { teks: null, sumber: 'template', alasan: 'ditolak-pengaman' }
    } catch (e) {
      meter.llm.gagal += 1
      console.warn('[ai] Groq gagal:', e.message)
      return { teks: null, sumber: 'template', alasan: e.status === 429 ? 'kuota-groq' : 'gagal' }
    }
  }

  /** Cache bersama + bentuk jawaban { [kunciTeks]: teks|null, sumber, model?, alasan?, cache }. */
  async function llmTercache(kunciCache, kunciTeks, fakta, panggil, wajar) {
    const h = await cache(kunciCache, async () => {
      const r = await jalankanLlm(fakta, panggil, wajar)
      return {
        [kunciTeks]: r.teks,
        sumber: r.sumber,
        ...(r.model && { model: r.model }),
        ...(r.alasan && { alasan: r.alasan }),
      }
    })
    segarkanMeter()
    if (h.cache) meter.llm.cache += 1
    return h
  }

  const app = new Hono()

  app.post('/ringkasan-dasbor', batasBody(2 * 1024), async (c) => {
    // 1. Batas per IP dulu, agar spam (termasuk yang tidak valid) tidak membebani server.
    if (!boleh(ipDari(c)))
      throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering meminta ringkasan. Coba lagi sebentar.')

    // 2. Validasi ketat: hanya angka & id wilayah resmi. Fakta disusun SERVER, bukan klien.
    const body = await c.req.json().catch(() => null)
    const bahan = validasiBahanDasbor(body?.bahan, W)
    const fakta = faktaDasbor(bahan, W)

    if (!apiKey) return c.json({ data: { ringkasan: null, sumber: 'template', alasan: 'ai-mati', cache: false } })

    // 3. Cache bersama (fakta sama ⇒ satu panggilan untuk semua pengunjung), 4. pengaman angka di jalankanLlm.
    const hasil = await llmTercache(fakta, 'ringkasan', fakta, () => tulis(fakta, { apiKey }))
    return c.json({ data: hasil })
  })

  app.post('/foto', batasBody(2 * 1024 * 1024, 'Foto terlalu besar (maks. 1,5 MB).'), async (c) => {
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
      const t0 = Date.now()
      const hasil = await antrean(() =>
        tugas === 'klasifikasi'
          ? vision.klasifikasi(buffer, file.type)
          : tugas === 'detail'
            ? vision.detail(buffer, file.type, kategoriId)
            : vision.verifikasi(buffer, file.type, kategoriId),
      )
      const ms = Date.now() - t0
      segarkanMeter()
      meter.vision.analisis += 1
      meter.vision.ms += ms
      return c.json({ data: { ...hasil, ms } })
    } catch (e) {
      if (e.kode === 'SIBUK') return c.json({ error: { kode: 'SIBUK', pesan: e.message } }, 503)
      console.warn('[ai] vision gagal:', e.message)
      throw new GalatDomain(KODE_GALAT.VALIDASI, 'Foto tidak bisa dibaca.')
    }
  })

  // ── Khusus petugas ──
  const batasPetugas = async (c, next) => {
    if (!bolehPetugas(ipDari(c)))
      throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering meminta bantuan AI. Coba lagi sebentar.')
    await next()
  }

  app.post('/briefing-antrean', wajibInstansi, batasPetugas, async (c) => {
    // Fakta dari data server sendiri; klien tidak mengirim apa pun ⇒ tidak ada celah injeksi prompt.
    const semua = (await repo.semua()).map((l) => tampilanPublik(l))
    const ringkasan = ringkasanAntrean(semua, sekarang())
    const fakta = faktaBriefing(ringkasan, W)
    if (!apiKey) return c.json({ data: { briefing: null, sumber: 'template', alasan: 'ai-mati', fakta, ringkasan } })
    const h = await llmTercache(`briefing\n${fakta}`, 'briefing', fakta, () =>
      tulisPrompt(fakta, PROMPT_BRIEFING, { apiKey }),
    )
    return c.json({ data: { ...h, prompt: PROMPT_BRIEFING.versi, fakta, ringkasan } })
  })

  app.post('/draf-tanggapan', wajibInstansi, batasPetugas, batasBody(2 * 1024), async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const kode = typeof body?.kode === 'string' && body.kode.length <= 20 ? body.kode : null
    const asli = kode && (await repo.cari(kode))
    if (!asli) throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, 'Laporan tidak ditemukan.')
    const laporan = tampilanPublik(asli)
    const ke = String(body?.ke ?? '')
    if (!bisaTransisi(laporan.status, ke, PERAN.INSTANSI))
      throw new GalatDomain(KODE_GALAT.VALIDASI, 'Status tujuan tidak sah untuk laporan ini.')
    // Hanya data terstruktur + catatan petugas (terautentikasi). Deskripsi warga TIDAK masuk prompt.
    const fakta = faktaTanggapan(laporan, ke, W, {
      catatan: typeof body?.catatan === 'string' ? body.catatan.replace(/[<>]/g, '') : '',
      sekarang: sekarang(),
    })
    if (!apiKey) return c.json({ data: { draf: null, sumber: 'template', alasan: 'ai-mati' } })
    const h = await llmTercache(
      `tanggapan\n${fakta}`,
      'draf',
      fakta,
      () => tulisPrompt(fakta, PROMPT_TANGGAPAN, { apiKey }),
      tanggapanWajar,
    )
    return c.json({ data: { ...h, prompt: PROMPT_TANGGAPAN.versi } })
  })

  app.get('/pemakaian', wajibInstansi, (c) => {
    segarkanMeter()
    const llm = konfigLlm()
    return c.json({
      data: {
        hari: hariMeter,
        llm: {
          ...meter.llm,
          aktif: Boolean(apiKey),
          model: llm.modelId,
          versi: llm.versi,
          batasTokenHarian: ai.batasTokenHarian,
          sisaToken: plafon.sisa(),
          perkiraanTokenPerPanggilan: PERKIRAAN_TOKEN,
          batasPerMenitPerIp: ai.batasPerMenitPerIp,
          prompt: [PROMPT_BRIEFING.versi, PROMPT_TANGGAPAN.versi],
        },
        vision: {
          ...meter.vision,
          rataMs: meter.vision.analisis ? Math.round(meter.vision.ms / meter.vision.analisis) : 0,
          model: vision.VISION,
          batasPerMenitPerIp: ai.batasFotoPerMenitPerIp ?? 30,
        },
      },
    })
  })

  return app
}
