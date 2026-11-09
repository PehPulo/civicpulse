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
//
// ── Tugas LLM tambahan (registry apps/api/src/ai/prompt-tugas.js) ──
// POST /ai/tulis/:tugas   body sesuai tugas; fakta SELALU disusun server dari data resmi.
//   Warga  : beranda {} · penjelasan {kode} · tips {kode} · wilayah {wilayahId} · bantu-tulis {kategoriId, judul, deskripsi}
//            · metodologi {pertanyaan}
//   Petugas: saran-tindakan {kode} · supervisi {provinsiId?} · rekap {provinsiId?, kabkotaId?, hari?, regu?, kapasitas?}
//            · tanya-data {pertanyaan, provinsiId?, kabkotaId?}
//   200 { data: { teks: string|null, sumber: 'ai'|'template', alasan?, model?, prompt, fakta?, saran?, cache } }
// GET  /ai/pemakaian          meteran hari ini: token LLM vs plafon, panggilan, cache, ditolak, analisis foto, waktu rata-rata
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import {
  GalatDomain,
  KODE_GALAT,
  PERAN,
  agregatWilayah,
  bahanDasbor,
  bersihkanTeksBebas,
  bolehSupervisi,
  faktaMetodologi,
  faktaPenjelasan,
  faktaRekap,
  faktaSaranTindakan,
  faktaSupervisi,
  faktaTanyaData,
  faktaTips,
  faktaWilayah,
  kategoriById,
  skorKinerjaWilayah,
  statistik as hitungStatistik,
  bisaTransisi,
  bolehUbahStatus,
  dalamAkses,
  faktaBriefing,
  faktaDasbor,
  faktaTanggapan,
  keluaranAman,
  lokasiLaporan,
  ringkasanAntrean,
  tampilanPublik,
  tanggapanWajar,
  validasiBahanDasbor,
} from '@civicpulse/core'
import { INDEKS_WILAYAH, NASIONAL, W } from '../lib/wilayah.js'
import { config } from '../config.js'
import { konfigLlm, tulisDenganPrompt, tulisPesan, tulisRingkasan } from '../ai/groq.js'
import { TUGAS, pesanTugas } from '../ai/prompt-tugas.js'
import { PROMPT_BRIEFING, PROMPT_TANGGAPAN } from '../ai/prompt-instansi.js'
import { buatAntrean, buatBatasLaju, buatCache, buatPlafonHarian } from '../ai/penjaga.js'
import * as visionAsli from '../ai/vision.js'
import { ipKlien } from '../lib/ip.js'
import { wajibInstansi } from '../middleware/identitas.js'
import * as repoAsli from '../repositories/laporan.js'

const PERKIRAAN_TOKEN = 800 // per panggilan (±660 terukur di ml/reports), dibulatkan ke atas
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
  tulisTugas = tulisPesan,
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

  app.post('/briefing-antrean', wajibInstansi, batasPetugas, batasBody(1024), async (c) => {
    // Fakta dari data server sendiri; klien hanya boleh mengirim ID cakupan (bukan teks) ⇒ tanpa celah injeksi.
    // Dibatasi yurisdiksi admin: kab/kota melihat wilayahnya, provinsi provinsinya, pusat seluruh Indonesia.
    // Cakupan opsional { provinsiId?, kabkotaId? } hanya MEMPERSEMPIT yurisdiksi (filter tambahan).
    const akses = c.get('akses')
    const body = await c.req.json().catch(() => ({}))
    const id = (v) => (typeof v === 'string' && /^[a-z0-9-]{2,60}$/.test(v) ? v : null)
    const pv = id(body?.provinsiId)
    const kk = id(body?.kabkotaId)
    const semua = (await repo.semua())
      .filter((l) => dalamAkses(l, akses, INDEKS_WILAYAH))
      .filter((l) => {
        const lok = lokasiLaporan(l, INDEKS_WILAYAH)
        return (!pv || lok.provinsiId === pv) && (!kk || lok.kabkotaId === kk)
      })
      .map((l) => tampilanPublik(l))
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
    const akses = c.get('akses')
    if (!bolehUbahStatus(akses) || !dalamAkses(asli, akses, INDEKS_WILAYAH))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')
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

  // ── Tugas LLM tambahan ──
  const batasTugas = Object.fromEntries(
    Object.entries(TUGAS).map(([id, t]) => [id, buatBatasLaju({ maks: t.perMenit })]),
  )
  const idAman = (v) => (typeof v === 'string' && /^[a-z0-9-]{2,60}$/.test(v) ? v : null)
  const tidakAda = (pesan = 'Laporan tidak ditemukan.') => new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, pesan)

  async function laporanPublik(kode) {
    const k = typeof kode === 'string' && kode.length <= 20 ? kode.toUpperCase() : null
    const l = k && (await repo.cari(k))
    if (!l) throw tidakAda()
    return tampilanPublik(l)
  }

  /** Laporan dalam yurisdiksi admin, opsional dipersempit {provinsiId, kabkotaId}. */
  async function laporanAkses(akses, body) {
    const pv = idAman(body?.provinsiId)
    const kk = idAman(body?.kabkotaId)
    return (await repo.semua())
      .filter((l) => dalamAkses(l, akses, INDEKS_WILAYAH))
      .filter((l) => {
        const lok = lokasiLaporan(l, INDEKS_WILAYAH)
        return (!pv || lok.provinsiId === pv) && (!kk || lok.kabkotaId === kk)
      })
      .map((l) => tampilanPublik(l))
  }

  const angkaAman = (v, min, maks, bawaan) =>
    v != null && Number.isFinite(+v) ? Math.min(maks, Math.max(min, Math.round(+v))) : bawaan

  /** Penyusun fakta per tugas: (body, akses) ⇒ { fakta, teksBebas? }. */
  const PENYUSUN = {
    beranda: async () => ({
      fakta: faktaDasbor(bahanDasbor(hitungStatistik(await repo.semua(), W, sekarang())), W),
    }),
    penjelasan: async (b) => ({ fakta: faktaPenjelasan(await laporanPublik(b?.kode), W, sekarang()) }),
    tips: async (b) => {
      const l = await laporanPublik(b?.kode)
      return { fakta: faktaTips(l.kategoriId, l.prioritas.level) }
    },
    wilayah: async (b) => {
      const w = INDEKS_WILAYAH.get(idAman(b?.wilayahId))
      if (!w) throw tidakAda('Wilayah tidak ditemukan.')
      return { fakta: faktaWilayah(await repo.semua(), w, sekarang()) }
    },
    'bantu-tulis': async (b) => {
      const kat = kategoriById(b?.kategoriId)
      const judul = bersihkanTeksBebas(b?.judul, 120)
      const deskripsi = bersihkanTeksBebas(b?.deskripsi, 600)
      if (deskripsi.length < 10) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Tulis deskripsi minimal 10 huruf dulu.')
      return {
        fakta: `Kategori: ${kat?.label ?? 'Lainnya'}.`,
        teksBebas: `Judul: ${judul || '-'}\nDeskripsi: ${deskripsi}`,
      }
    },
    metodologi: async (b) => {
      const q = bersihkanTeksBebas(b?.pertanyaan, 200)
      if (q.length < 5) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Pertanyaan terlalu pendek.')
      return { fakta: faktaMetodologi(), teksBebas: q }
    },
    'saran-tindakan': async (b, akses) => {
      const k = typeof b?.kode === 'string' && b.kode.length <= 20 ? b.kode : null
      const asli = k && (await repo.cari(k))
      if (!asli) throw tidakAda()
      if (!dalamAkses(asli, akses, INDEKS_WILAYAH))
        throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')
      return { fakta: faktaSaranTindakan(tampilanPublik(asli), W, sekarang()) }
    },
    supervisi: async (b, akses) => {
      if (!bolehSupervisi(akses))
        throw new GalatDomain(KODE_GALAT.DILARANG, 'Catatan supervisi hanya untuk admin provinsi dan pusat.')
      // Pusat melihat per provinsi (atau per kab/kota bila memilih satu provinsi); provinsi melihat kab/kotanya.
      const pv = akses.tingkat === 'provinsi' ? akses.provinsiId : idAman(b?.provinsiId)
      const lap = await laporanAkses(akses, { provinsiId: pv })
      const kunci = pv ? 'kabkotaId' : 'provinsiId'
      const daftar = pv ? NASIONAL.kabkota.filter((x) => x.provinsiId === pv) : NASIONAL.provinsi
      const ag = agregatWilayah(lap, kunci, INDEKS_WILAYAH, sekarang())
      const baris = daftar.map((w) => {
        const a = ag.get(w.id) ?? { total: 0, terbuka: 0, lewatSla: 0, persenTepat: null }
        return {
          nama: w.nama,
          skor: skorKinerjaWilayah(a),
          terbuka: a.terbuka,
          lewatSla: a.lewatSla,
          persenTepat: a.persenTepat,
        }
      })
      const cakupan = pv ? (NASIONAL.provinsi.find((x) => x.id === pv)?.nama ?? pv) : 'Indonesia'
      return { fakta: faktaSupervisi(baris, { cakupan, satuan: pv ? 'Kab/kota' : 'Provinsi' }) }
    },
    rekap: async (b, akses) => {
      // Periode opsional (hari terakhir, 0 = semua), sama dengan pilihan periode di halaman Rekap.
      const hari = angkaAman(b?.hari, 0, 3650, 0)
      const batas = hari ? Date.parse(sekarang()) - hari * 86_400_000 : 0
      const lap = (await laporanAkses(akses, b)).filter((l) => Date.parse(l.dibuat) >= batas)
      const isi = faktaRekap(lap, sekarang(), {
        regu: angkaAman(b?.regu, 1, 50, 3),
        kapasitas: angkaAman(b?.kapasitas, 1, 20, 2),
      })
      return {
        fakta: `${hari ? `Periode: ${hari} hari terakhir.` : 'Periode: semua waktu.'}
${isi}`,
      }
    },
    'tanya-data': async (b, akses) => {
      const q = bersihkanTeksBebas(b?.pertanyaan, 160)
      if (q.length < 5) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Pertanyaan terlalu pendek.')
      return { fakta: faktaTanyaData(ringkasanAntrean(await laporanAkses(akses, b), sekarang()), W), teksBebas: q }
    },
  }

  /** Hasil bantu-tulis wajib 2 baris JUDUL/DESKRIPSI, panjang wajar. */
  const pecahBantuTulis = (teks) => {
    const m = /JUDUL:\s*(.+?)\s*\n+\s*DESKRIPSI:\s*([\s\S]+)/i.exec(teks ?? '')
    if (!m) return null
    const bersih = (x) => x.replace(/^["'*\s]+|["'*\s]+$/g, '')
    const judul = bersih(m[1])
    const deskripsi = bersih(m[2])
    if (judul.length < 5 || judul.length > 100 || deskripsi.length < 10 || deskripsi.length > 700) return null
    return { judul, deskripsi }
  }
  const tanpaTautan = (t) => !/https?:\/\/|www\.|<[a-z/]/i.test(t)

  app.post('/tulis/:tugas', batasBody(4 * 1024), async (c) => {
    const id = c.req.param('tugas')
    const tugas = Object.hasOwn(TUGAS, id) ? TUGAS[id] : null
    if (!tugas) throw tidakAda('Tugas AI tidak dikenal.')
    if (tugas.akses === 'petugas') await wajibInstansi(c, async () => {})
    if (!batasTugas[id](ipDari(c)))
      throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering meminta bantuan AI. Coba lagi sebentar.')

    const body = await c.req.json().catch(() => ({}))
    const { fakta, teksBebas = '' } = await PENYUSUN[id](body, c.get('akses'))
    const dasar = { prompt: tugas.versi, ...(id !== 'bantu-tulis' && { fakta }) }
    if (!apiKey) return c.json({ data: { teks: null, sumber: 'template', alasan: 'ai-mati', cache: false, ...dasar } })

    // Angka di keluaran boleh berasal dari fakta ATAU teks pengguna sendiri (mis. "3 rumah" di draf laporan).
    const faktaPengaman = teksBebas ? `${fakta}\n${teksBebas}` : fakta
    const wajar = id === 'bantu-tulis' ? (t) => tanpaTautan(t) && Boolean(pecahBantuTulis(t)) : tanpaTautan
    const h = await llmTercache(
      `${id}\n${fakta}\n${teksBebas.toLowerCase()}`,
      'teks',
      faktaPengaman,
      () => tulisTugas(pesanTugas(tugas, fakta, teksBebas), { apiKey, maks: tugas.maks }),
      wajar,
    )
    const saran = id === 'bantu-tulis' && h.teks ? { saran: pecahBantuTulis(h.teks) } : {}
    return c.json({ data: { ...h, ...saran, ...dasar } })
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
          prompt: [PROMPT_BRIEFING.versi, PROMPT_TANGGAPAN.versi, ...Object.values(TUGAS).map((t) => t.versi)],
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
