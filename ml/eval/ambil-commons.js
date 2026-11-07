// PEMILIK: Ezra · KONTRAK: docs/MLOPS.md
// Mengunduh foto uji ASLI berlisensi bebas dari Wikimedia Commons ke ml/eval/images/ dan mencatat
// penulis + lisensi + URL tiap foto di ml/eval/sumber.csv (wajib untuk atribusi).
// Label awal berasal dari kategori/kueri; WAJIB dicek manual (hapus baris yang salah di labels.csv).
//
//   node ml/eval/ambil-commons.js            # unduh (lewati yang sudah ada)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = fileURLToPath(new URL('./images/', import.meta.url))
const UA = 'CivicPulse-eval/0.1 (https://github.com/PehPulo/civicpulse; evaluasi model lomba)'
const API = 'https://commons.wikimedia.org/w/api.php'
const PER_KELAS = Number(process.env.PER_KELAS ?? 12)
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

// Hasil kurasi manual (judul Commons): foto yang tidak cocok dengan kelasnya (lukisan, diagram, malam, di luar topik).
const TOLAK = new Set(
  existsSync(new URL('./tolak.txt', import.meta.url))
    ? readFileSync(new URL('./tolak.txt', import.meta.url), 'utf8')
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean)
    : [],
)
const slug = (judul) =>
  judul
    .replace(/^File:/, '')
    .replace(/\.[a-z]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

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

mkdirSync(DIR, { recursive: true })
const label = ['file,label']
const sumber = ['file,label,judul,penulis,lisensi,url']
for (const [kelas, daftar] of Object.entries(SUMBER)) {
  const dipilih = []
  for (const s of daftar) {
    if (dipilih.length >= PER_KELAS) break
    const judul = (await judulDari(s)).filter((j) => !TOLAK.has(j) && !dipilih.some((d) => d.judul === j))
    await tidur(1500)
    for (let i = 0; i < judul.length && dipilih.length < PER_KELAS; i += 20) {
      for (const x of await info(judul.slice(i, i + 20))) {
        const m = x.ii.extmetadata ?? {}
        const lisensi = bersih(m.LicenseShortName?.value)
        if (!LISENSI_OK.test(lisensi) || dipilih.length >= PER_KELAS || dipilih.some((d) => d.judul === x.judul))
          continue
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
  for (const d of dipilih) {
    const file = `${kelas}_${slug(d.judul)}.jpg`
    if (!existsSync(DIR + file)) {
      const res = await fetch(d.thumb, { headers: { 'User-Agent': UA } })
      if (!res.ok) continue
      writeFileSync(DIR + file, Buffer.from(await res.arrayBuffer()))
      await tidur(800)
    }
    label.push(`${file},${kelas}`)
    sumber.push([file, kelas, d.judul, d.penulis, d.lisensi, d.url].map(csv).join(','))
  }
  console.log(`${kelas}: ${dipilih.length} foto`)
}
writeFileSync(new URL('./labels.csv', import.meta.url), label.join('\n') + '\n')
writeFileSync(new URL('./sumber.csv', import.meta.url), sumber.join('\n') + '\n')
