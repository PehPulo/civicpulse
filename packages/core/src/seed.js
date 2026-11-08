// Seed data demo (deterministik). Sebaran sengaja meniru masalah nyata:
// wilayah kota yang "vokal" punya banyak laporan berisiko rendah, wilayah rawan di pinggiran senyap.
import { PERAN, STATUS, terapkanTransisi } from './status.js'
import { buatLaporan } from './laporan.js'

export const VERSI_SEED = '2026.11.08-nasional'

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const JUDUL = {
  drainase: ['Saluran air tersumbat sampah', 'Gorong-gorong mampet', 'Got meluap ke jalan'],
  banjir: ['Genangan setinggi lutut', 'Banjir masuk permukiman', 'Air sungai meluap'],
  jalan: ['Jalan berlubang dalam', 'Aspal mengelupas', 'Jalan amblas di tikungan'],
  longsor: ['Tebing retak di samping jalan', 'Longsoran tanah menutup jalan'],
  lainnya: ['Lampu jalan mati', 'Pohon tumbang'],
}

// [wilayahId, jumlah laporan, kategori dominan]
const SEBARAN = [
  ['coblong', 9, ['drainase', 'jalan', 'lainnya']],
  ['sukajadi', 8, ['drainase', 'jalan', 'lainnya']],
  ['cimahi-selatan', 5, ['banjir', 'drainase', 'jalan']],
  ['bojongsoang', 4, ['banjir', 'drainase']],
  ['dayeuhkolot', 4, ['banjir', 'drainase']],
  ['baleendah', 3, ['banjir', 'drainase']],
  ['lembang', 2, ['longsor', 'jalan']],
  ['cisarua', 1, ['longsor']],
]

const HARI = 86400000

// Foto ilustrasi berlisensi bebas (Wikimedia Commons) untuk laporan demo berprioritas tertinggi, agar fitur
// computer vision petugas bisa dicoba. File di apps/web/public/demo/, sumber lengkap di ml/eval/sumber.csv.
export const FOTO_DEMO = {
  banjir: [
    ['banjir_banjir-jakarta-2013.jpg', 'Thedonz · CC BY-SA 3.0'],
    ['banjir_kota-banjarmasin-saat-banjir-kalsel-2021.jpg', 'Muhammad Ramadhana · CC BY-SA 4.0'],
  ],
  longsor: [['longsor_untitled-panoramio-kharistama-2.jpg', 'kharistama · CC BY 3.0']],
  jalan: [
    ['jalan_bache-mediano.jpg', 'Dan crxs · CC BY 4.0'],
    ['jalan_bache-en-coyoacan.jpg', 'Msofiaa · CC BY 4.0'],
  ],
  drainase: [
    ['drainase_waste-in-rain-gutter-near-school-bali.jpg', 'DayakSibiriak · CC BY-SA 4.0'],
    ['drainase_storm-drain-clogged-mid-city-new-orleans.jpg', 'Bart Everson · CC BY 2.0'],
  ],
  lainnya: [['lainnya_broken-lamppost-streetlight-on-a899-livingston-roa.jpg', 'Simon Johnston · CC BY-SA 2.0']],
}

function pasangFotoDemo(semua) {
  for (const [kategoriId, daftar] of Object.entries(FOTO_DEMO)) {
    const sasaran = semua
      .filter((l) => l.kategoriId === kategoriId && !l.ilustrasi)
      .sort((a, b) => b.prioritas.skor - a.prioritas.skor || a.kode.localeCompare(b.kode))
    daftar.forEach(([file, kredit], i) => {
      if (!sasaran[i]) return
      sasaran[i].fotoUrl = `/demo/${file}`
      sasaran[i].fotoKredit = `Foto ilustrasi: ${kredit} · Wikimedia Commons`
    })
  }
  return semua
}

export function buatSeed(daftarWilayah, sekarang = Date.now()) {
  const acak = mulberry32(20261107)
  const pilih = (xs) => xs[Math.floor(acak() * xs.length)]
  const iso = (hariLalu) => new Date(sekarang - hariLalu * HARI).toISOString()
  const semua = []
  let nomor = 100

  const tambah = (input, { kode, hariLalu, alur, tanggapan, verifikasiBeres = 0 }) => {
    let l = buatLaporan(input, {
      daftarWilayah,
      semuaLaporan: semua,
      pelaporId: `seed-${kode}`,
      kode,
      waktu: iso(hariLalu),
    })
    l.dukungan = Array.from({ length: Math.floor(acak() * 4) }, (_, i) => `seed-dukung-${kode}-${i}`)
    let h = hariLalu
    for (const ke of alur) {
      h = Math.max(0.2, h - (1 + acak() * 5))
      const catatan = {
        diproses: 'Diteruskan ke dinas terkait dan dijadwalkan penanganan.',
        klaim_selesai: 'Instansi menyatakan penanganan sudah selesai.',
        terverifikasi: 'Dikonfirmasi warga sekitar lewat foto berlokasi.',
      }[ke]
      const oleh = ke === STATUS.TERVERIFIKASI ? PERAN.SISTEM : PERAN.INSTANSI
      if (ke === STATUS.TERVERIFIKASI) {
        l.verifikasi = Array.from({ length: 3 }, (_, i) =>
          verifikasiSeed(l, `seed-ver-${kode}-${i}`, true, iso(h + 0.1)),
        )
      }
      l = terapkanTransisi(l, ke, { oleh, catatan, waktu: iso(h) })
    }
    if (verifikasiBeres) {
      l.verifikasi = Array.from({ length: verifikasiBeres }, (_, i) =>
        verifikasiSeed(l, `seed-ver-${kode}-${i}`, true, iso(Math.max(0.1, h - 0.5))),
      )
    }
    if (tanggapan) l.tanggapan = { isi: tanggapan, petugas: 'Dinas PUTR', waktu: iso(h), buktiUrl: null }
    semua.push(l)
  }

  // Dua laporan tetap untuk demo & dokumen (kode stabil).
  tambah(
    {
      kategoriId: 'drainase',
      lat: -6.9871,
      lng: 107.6252,
      judul: 'Saluran air tersumbat sampah di depan pasar',
      deskripsi:
        'Saluran di Jl. Raya Dayeuhkolot tertutup sampah dan lumpur. Saat hujan sore air meluap ke jalan dan masuk ke rumah warga.',
    },
    {
      kode: 'CP-2026-0417',
      hariLalu: 12,
      alur: [STATUS.DIPROSES, STATUS.KLAIM_SELESAI],
      tanggapan: 'Pengerukan saluran sepanjang ±120 m telah dilakukan bersama petugas kebersihan kecamatan.',
      verifikasiBeres: 1,
    },
  )
  tambah(
    {
      kategoriId: 'jalan',
      lat: -6.8125,
      lng: 107.6181,
      judul: 'Jalan berlubang di tanjakan menuju sekolah',
      deskripsi: 'Lubang sedalam ±20 cm di tikungan tanjakan, sudah dua kali pengendara motor jatuh.',
    },
    { kode: 'CP-2026-0388', hariLalu: 33, alur: [STATUS.DIPROSES] },
  )

  const ALUR = [
    [],
    [],
    [STATUS.DIPROSES],
    [STATUS.DIPROSES],
    [STATUS.DIPROSES, STATUS.KLAIM_SELESAI],
    [STATUS.DIPROSES, STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI],
    [STATUS.DIPROSES, STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI],
  ]

  for (const [wilayahId, jumlah, kategori] of SEBARAN) {
    const w = daftarWilayah.find((x) => x.id === wilayahId)
    for (let i = 0; i < jumlah; i++) {
      const kategoriId = pilih(kategori)
      const hariLalu = 1 + acak() * 50
      const alur = pilih(ALUR)
      tambah(
        {
          kategoriId,
          lat: w.lat + (acak() - 0.5) * 0.012,
          lng: w.lng + (acak() - 0.5) * 0.012,
          judul: `${pilih(JUDUL[kategoriId])} di Kec. ${w.kecamatan}`,
          deskripsi: 'Kondisi sudah berlangsung beberapa hari dan mengganggu aktivitas warga sekitar.',
        },
        { kode: `CP-2026-${String(nomor++).padStart(4, '0')}`, hariLalu: Math.max(hariLalu, alur.length * 7), alur },
      )
    }
  }

  // Laporan ILUSTRASI se-Indonesia: hanya bila daftar wilayah memuat wilayah ilustrasi (gabungWilayah).
  // Generator acak terpisah agar data pilot di atas tetap identik.
  const ilustrasi = daftarWilayah.filter((w) => w.ilustrasi)
  if (ilustrasi.length) {
    const acakN = mulberry32(20261108)
    const pilihN = (xs) => xs[Math.floor(acakN() * xs.length)]
    const perProvinsi = new Map()
    for (const w of ilustrasi) perProvinsi.set(w.provinsiId, [...(perProvinsi.get(w.provinsiId) ?? []), w])
    let nomorN = 1000
    for (const [, daftar] of [...perProvinsi].sort(([a], [b]) => a.localeCompare(b))) {
      const jumlah = 2 + Math.round(daftar.length / 5 + acakN() * 2)
      for (let i = 0; i < jumlah; i++) {
        const w = pilihN(daftar)
        const kategoriId = pilihN(['banjir', 'drainase', 'jalan', 'jalan', 'longsor', 'lainnya'])
        const alur = pilihN(ALUR)
        const hariLalu = 1 + acakN() * 45
        tambah(
          {
            kategoriId,
            lat: w.lat + (acakN() - 0.5) * 0.02,
            lng: w.lng + (acakN() - 0.5) * 0.02,
            judul: `${pilihN(JUDUL[kategoriId])} di ${w.kecamatan}`,
            deskripsi: 'Laporan ilustrasi untuk demo cakupan nasional (bukan laporan warga sungguhan).',
          },
          { kode: `CP-2026-${String(nomorN++).padStart(4, '0')}`, hariLalu: Math.max(hariLalu, alur.length * 6), alur },
        )
        semua.at(-1).ilustrasi = true
      }
    }
  }

  return pasangFotoDemo(semua).sort((a, b) => b.dibuat.localeCompare(a.dibuat))
}

function verifikasiSeed(laporan, deviceId, beres, waktu) {
  return {
    deviceId,
    beres,
    fotoUrl: null,
    lat: laporan.lat,
    lng: laporan.lng,
    waktu,
    waktuFoto: waktu,
    sah: true,
    cek: { lokasiOk: true, waktuOk: true, aiMeragukan: false },
    ai: null,
  }
}
