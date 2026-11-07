// PEMILIK: Ezra · KONTRAK: docs/DATA.md
//
// Membangun data/processed/wilayah.json dari file mentah ASLI di data/raw/ (tanpa angka karangan):
//   rbi-2023-jiwa-terpapar.csv  BNPB, Buku RBI 2023: jiwa terpapar risiko rendah/sedang/tinggi per kab/kota
//   irbi-2023.csv               BNPB, IRBI 2023: indeks risiko total per kab/kota (dicatat sebagai konteks)
//   bps-miskin.csv              BPS, persentase penduduk miskin Maret 2024
//   wilayah-pilot.csv           kecamatan pilot + koordinat OpenStreetMap
//   dibi.csv (opsional)         BNPB DIBI, ekspor kejadian: tahun,kabkota,jenis,jumlah
//
// Rumus (ditulis juga di docs/DATA.md dan halaman Metodologi):
//   penduduk        = total jiwa terpapar gempabumi (seluruh penduduk kab/kota terpapar; penyebut dari tabel yang sama)
//   paparan(bahaya) = (jiwa risiko sedang + tinggi) / penduduk
//   risiko(bahaya)  = round(100 × paparan / paparan tertinggi di antara kab/kota pilot)   (0–100, relatif antarwilayah pilot)
//   risiko.jalan    = round((risiko.banjir + risiko.longsor) / 2)                          (proksi; IRBI tidak punya bahaya jalan)
//   kejadian5th     = jumlah kejadian DIBI 5 tahun terakhir; jalan = banjir + longsor (proksi). null jika dibi.csv belum ada.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const raw = (f) => fileURLToPath(new URL(`../raw/${f}`, import.meta.url))
const OUT = fileURLToPath(new URL('../processed/wilayah.json', import.meta.url))

function bacaCsv(file) {
  const [kepala, ...baris] = readFileSync(raw(file), 'utf8').trim().split(/\r?\n/)
  const kolom = kepala.split(',')
  return baris.map((b) => {
    // Kolom terakhir boleh mengandung koma (URL/keterangan): gabungkan sisanya.
    const sel = b.split(',')
    const isi = [...sel.slice(0, kolom.length - 1), sel.slice(kolom.length - 1).join(',')]
    return Object.fromEntries(kolom.map((k, i) => [k, isi[i]?.trim()]))
  })
}

const angka = (s) => Number(s)
const BAHAYA = ['banjir', 'longsor']

// 1. Paparan risiko per kab/kota (BNPB RBI 2023)
const rbi = bacaCsv('rbi-2023-jiwa-terpapar.csv')
const kabkota = [...new Set(rbi.map((r) => r.kabkota))]
const baris = (k, b) => {
  const r = rbi.find((x) => x.kabkota === k && x.bahaya === b)
  if (!r) throw new Error(`rbi-2023: baris ${k}/${b} tidak ada`)
  return r
}
const paparan = {}
for (const k of kabkota) {
  const g = baris(k, 'gempabumi')
  const penduduk = angka(g.rendah) + angka(g.sedang) + angka(g.tinggi)
  paparan[k] = { penduduk }
  for (const b of BAHAYA) {
    const r = baris(k, b)
    paparan[k][b] = (angka(r.sedang) + angka(r.tinggi)) / penduduk
  }
}
const maks = Object.fromEntries(BAHAYA.map((b) => [b, Math.max(...kabkota.map((k) => paparan[k][b]))]))
const risikoKab = Object.fromEntries(
  kabkota.map((k) => {
    const r = Object.fromEntries(BAHAYA.map((b) => [b, Math.round((100 * paparan[k][b]) / maks[b])]))
    r.jalan = Math.round((r.banjir + r.longsor) / 2)
    return [k, r]
  }),
)

// 2. Kemiskinan (BPS)
const bps = bacaCsv('bps-miskin.csv')
const miskinKab = Object.fromEntries(bps.map((r) => [r.kabkota, angka(r.persen_miskin)]))

// 3. Kejadian (DIBI), opsional
let kejadianKab = null
let periodeDibi = null
if (existsSync(raw('dibi.csv'))) {
  const dibi = bacaCsv('dibi.csv')
  const tahunAkhir = Math.max(...dibi.map((r) => angka(r.tahun)))
  const tahunAwal = tahunAkhir - 4
  periodeDibi = `${tahunAwal}–${tahunAkhir}`
  const jenis = (j) => (/longsor/i.test(j) ? 'longsor' : /banjir/i.test(j) && !/bandang/i.test(j) ? 'banjir' : null)
  kejadianKab = Object.fromEntries(kabkota.map((k) => [k, { banjir: 0, longsor: 0 }]))
  for (const r of dibi) {
    const b = jenis(r.jenis)
    const t = angka(r.tahun)
    if (b && kejadianKab[r.kabkota] && t >= tahunAwal) kejadianKab[r.kabkota][b] += angka(r.jumlah)
  }
  for (const k of kabkota) kejadianKab[k].jalan = kejadianKab[k].banjir + kejadianKab[k].longsor
}

// 4. Gabungkan ke kecamatan pilot lewat kab/kota induk
const pilot = bacaCsv('wilayah-pilot.csv')
const wilayah = pilot.map((p) => {
  for (const [nama, tabel] of [
    ['rbi', risikoKab],
    ['bps', miskinKab],
  ])
    if (!(p.kabkota in tabel)) throw new Error(`${p.id}: kab/kota "${p.kabkota}" tidak ada di data ${nama}`)
  return {
    id: p.id,
    kecamatan: p.kecamatan,
    kabupaten: p.kabkota,
    lat: angka(p.lat),
    lng: angka(p.lng),
    miskin: miskinKab[p.kabkota],
    risiko: risikoKab[p.kabkota],
    kejadian5th: kejadianKab ? kejadianKab[p.kabkota] : null,
  }
})

const irbi = bacaCsv('irbi-2023.csv')
const urlUnik = (rows, kolom = 'sumber_url') => [...new Set(rows.map((r) => r[kolom]))]

const hasil = {
  versi: kejadianKab ? '1.0.0' : '1.0.0-tanpa-dibi',
  ilustrasi: false,
  catatan:
    'Data asli BNPB (Buku RBI 2023, IRBI 2023), BPS (kemiskinan Maret 2024), dan OpenStreetMap. ' +
    'Nilai IRBI/RBI/BPS tersedia per kab/kota sehingga kecamatan dalam satu kab/kota memakai nilai yang sama. ' +
    'Skor risiko relatif antarwilayah pilot. Dibangun oleh data/scripts/build.js.' +
    (kejadianKab ? '' : ' Riwayat kejadian DIBI belum dimuat (kejadian5th = null).'),
  diperbarui: new Date().toISOString().slice(0, 10),
  sumber: {
    irbi: {
      nama: 'Risiko Bencana Indonesia 2023 (jiwa terpapar per kab/kota) & IRBI 2023',
      instansi: 'BNPB',
      tahun: 2023,
      url: urlUnik(rbi)[0],
      urlLain: [...urlUnik(rbi).slice(1), ...urlUnik(irbi)],
    },
    dibi: {
      nama: 'Data dan Informasi Bencana Indonesia',
      instansi: 'BNPB',
      periode: periodeDibi,
      url: kejadianKab ? 'https://dibi.bnpb.go.id/' : null,
    },
    bps: {
      nama: 'Persentase Penduduk Miskin Kabupaten/Kota',
      instansi: 'BPS',
      tahun: 2024,
      periode: 'Maret 2024',
      url: urlUnik(bps)[0],
      urlLain: urlUnik(bps).slice(1),
    },
    koordinat: {
      nama: 'Koordinat kecamatan (OpenStreetMap)',
      instansi: 'OSM',
      periode: 'diakses Nov 2026',
      url: 'https://www.openstreetmap.org/',
    },
  },
  konteks: Object.fromEntries(
    kabkota.map((k) => {
      const i = irbi.find((r) => r.kabkota === k)
      return [
        k,
        {
          penduduk: paparan[k].penduduk,
          persenTerpapar: Object.fromEntries(BAHAYA.map((b) => [b, Math.round(paparan[k][b] * 1000) / 10])),
          irbi2023: i ? { indeks: angka(i.indeks_2023), kelas: i.kelas_2023 } : null,
        },
      ]
    }),
  ),
  wilayah,
}

writeFileSync(OUT, JSON.stringify(hasil, null, 2) + '\n')
console.log(`✔ ${wilayah.length} wilayah ditulis ke data/processed/wilayah.json`)
for (const k of kabkota)
  console.log(
    `  ${k.padEnd(20)} penduduk ${paparan[k].penduduk.toLocaleString('id-ID').padStart(11)} · ` +
      BAHAYA.map((b) => `${b} ${(paparan[k][b] * 100).toFixed(1)}% → ${risikoKab[k][b]}`).join(' · ') +
      ` · jalan ${risikoKab[k].jalan} · miskin ${miskinKab[k]}%`,
  )
if (!kejadianKab) console.log('  ⚠ data/raw/dibi.csv belum ada: kejadian5th = null (lihat data/raw/README.md)')
