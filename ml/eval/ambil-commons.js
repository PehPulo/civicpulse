// PEMILIK: Ezra · KONTRAK: docs/MLOPS.md
// Mengunduh foto uji ASLI berlisensi bebas dari Wikimedia Commons ke ml/eval/images/ dan mencatat
// penulis + lisensi + URL tiap foto di ml/eval/sumber.csv (wajib untuk atribusi).
// Label awal berasal dari kategori/kueri; WAJIB dicek manual (judul yang ditolak → ml/eval/tolak.txt).
//
//   node ml/eval/ambil-commons.js            # foto masalah per kategori (label = kategori)
//   node ml/eval/ambil-commons.js --beres    # foto kondisi sudah beres per kategori (label = "beres"), untuk AI verifikasi
// Baris dari mode lain tidak dihapus; foto yang sudah ada tidak diunduh ulang.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = fileURLToPath(new URL('./images/', import.meta.url))
const UA = 'CivicPulse-eval/0.1 (https://github.com/PehPulo/civicpulse; evaluasi model lomba)'
const API = 'https://commons.wikimedia.org/w/api.php'
const BERES = process.argv.includes('--beres')
const PER = Number(process.env.PER_KELAS ?? (BERES ? 6 : 12))
const LISENSI_OK = /^(cc[- ]?by|cc[- ]?by[- ]?sa|cc0|public domain|pd)/i

// Sumber per kelas: kategori Commons dan/atau kueri pencarian (namespace File).
const SUMBER = {
  banjir: [
    { cari: 'banjir jalan' },
    { cari: 'flooded street Indonesia' },
    { cari: 'banjir Jakarta' },
    { kategori: 'Floods in Jakarta' },
  ],
  longsor: [{ kategori: 'Landslides in Indonesia' }, { cari: 'tanah longsor' }, { kategori: 'Landslides' }],
  jalan: [{ kategori: 'Potholes' }, { cari: 'jalan rusak berlubang' }],
  drainase: [
    { cari: 'selokan sampah' },
    { cari: 'saluran air sampah' },
    { cari: 'got sampah' },
    { cari: 'drainage canal garbage Indonesia' },
    { cari: 'clogged storm drain' },
  ],
  lainnya: [
    { cari: 'broken streetlight' },
    { cari: 'damaged footbridge' },
    { cari: 'broken sidewalk pavement' },
    { cari: 'fallen tree on road' },
  ],
}
const SUMBER_BERES = {
  drainase: [{ cari: 'clean concrete drainage channel' }, { cari: 'concrete drainage ditch' }],
  banjir: [{ cari: 'residential street Indonesia' }, { cari: 'quiet residential street' }],
  jalan: [{ cari: 'newly paved asphalt road' }, { cari: 'smooth asphalt road' }],
  longsor: [{ cari: 'gabion retaining wall slope' }, { cari: 'slope stabilization retaining wall' }],
  lainnya: [{ cari: 'new street light pole' }, { cari: 'new pedestrian bridge' }],
}

// Hasil kurasi manual (judul Commons): foto yang tidak cocok dengan kelasnya (lukisan, diagram, malam, di luar topik).
const TOLAK = new Set(
  existsSync(new URL('./tolak.txt', import.meta.url))
    ? readFileSync(new URL('./tolak.txt', import.meta.url), 'utf8')
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean)
    : [],
)
// Nama file: potongan judul + hash pendek, agar dua judul yang awalannya sama tidak saling menimpa.
const slug = (judul) =>
  judul
    .replace(/^File:/, '')
    .replace(/\.[a-z]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) +
  '-' +
  createHash('sha1').update(judul).digest('hex').slice(0, 6)

const tidur = (ms) => new Promise((r) => setTimeout(r, ms))
async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', maxlag: '5', ...params })}`
  for (let coba = 0; coba < 5; coba++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const teks = await res.text()
    if (res.ok && teks.startsWith('{')) return JSON.parse(teks)
    await tidur(5000 * (coba + 1))
  }
  throw new Error(`Commons API gagal: ${url}`)
}

async function judulDari(s) {
  if (s.kategori) {
    const r = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${s.kategori}`,
      cmtype: 'file',
      cmlimit: '200',
    })
    return r.query.categorymembers.map((m) => m.title)
  }
  const r = await api({ action: 'query', list: 'search', srnamespace: '6', srlimit: '50', srsearch: s.cari })
  return r.query.search.map((m) => m.title)
}

async function info(judul) {
  const r = await api({
    action: 'query',
    prop: 'imageinfo',
    titles: judul.join('|'),
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '512',
  })
  return Object.values(r.query.pages)
    .map((p) => ({ judul: p.title, ii: p.imageinfo?.[0] }))
    .filter((x) => x.ii && /jpeg|png/.test(x.ii.mime))
}

const bersih = (html = '') =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
const csv = (s) => `"${String(s).replaceAll('"', '""')}"`
const lama = (f) => {
  const u = new URL(f, import.meta.url)
  return existsSync(u) ? readFileSync(u, 'utf8').trim().split(/\r?\n/).slice(1) : []
}
const labelBaris = (b) => b.split(',')[1]?.replaceAll('"', '')
// Pertahankan baris milik mode lain.
const milikModeLain = (b) => (BERES ? labelBaris(b) !== 'beres' : labelBaris(b) === 'beres')

mkdirSync(DIR, { recursive: true })
const label = []
const sumber = []
for (const [kelas, daftar] of Object.entries(BERES ? SUMBER_BERES : SUMBER)) {
  const dipilih = []
  for (const s of daftar) {
    if (dipilih.length >= PER) break
    const judul = (await judulDari(s)).filter((j) => !TOLAK.has(j) && !dipilih.some((d) => d.judul === j))
    await tidur(1500)
    for (let i = 0; i < judul.length && dipilih.length < PER; i += 20) {
      for (const x of await info(judul.slice(i, i + 20))) {
        const m = x.ii.extmetadata ?? {}
        const lisensi = bersih(m.LicenseShortName?.value)
        if (!LISENSI_OK.test(lisensi) || dipilih.length >= PER || dipilih.some((d) => d.judul === x.judul)) continue
        dipilih.push({
          judul: x.judul,
          thumb: x.ii.thumburl,
          url: x.ii.descriptionurl,
          lisensi,
          penulis: bersih(m.Artist?.value) || '-',
        })
      }
      await tidur(1500)
    }
  }
  const lbl = BERES ? 'beres' : kelas
  for (const d of dipilih) {
    const file = `${BERES ? `beres-${kelas}` : kelas}_${slug(d.judul)}.jpg`
    if (!existsSync(DIR + file)) {
      const res = await fetch(d.thumb, { headers: { 'User-Agent': UA } })
      if (!res.ok) continue
      writeFileSync(DIR + file, Buffer.from(await res.arrayBuffer()))
      await tidur(800)
    }
    label.push(`${file},${lbl}`)
    sumber.push([file, lbl, d.judul, d.penulis, d.lisensi, d.url].map(csv).join(','))
  }
  console.log(`${BERES ? 'beres/' : ''}${kelas}: ${dipilih.length} foto`)
}
const tulis = (f, kepala, baru) =>
  writeFileSync(new URL(f, import.meta.url), [kepala, ...lama(f).filter(milikModeLain), ...baru].join('\n') + '\n')
tulis('./labels.csv', 'file,label', label)
tulis('./sumber.csv', 'file,label,judul,penulis,lisensi,url', sumber)
