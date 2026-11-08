// PEMILIK: Ezra (data) · `npm run data:geo`
// Bangun data wilayah nasional dari geoBoundaries (data/raw/geo):
//   · data/processed/nasional.json            34 provinsi + 514 kab/kota (meta: id, nama, jenis, provinsi, titik tengah)
//   · apps/web/public/geo/provinsi.json        batas provinsi (disederhanakan) untuk peta nasional
//   · apps/web/public/geo/kabkota/<prov>.json  batas kab/kota per provinsi (dimuat saat dibutuhkan)
// Sumber: ADM1 OpenStreetMap/Wambacher (ODbL 1.0), ADM2 BPS/WFP/OCHA (CC BY 3.0 IGO), lewat geoBoundaries.
// Tanpa dependensi: penyederhanaan Douglas–Peucker & titik-dalam-poligon ditulis di sini.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const p = (rel) => fileURLToPath(new URL(rel, import.meta.url))
const baca = (f) => JSON.parse(readFileSync(p(`../raw/geo/${f}`), 'utf8'))

const NAMA_PROVINSI = {
  Aceh: 'Aceh',
  Bali: 'Bali',
  'Bangka-Belitung Islands': 'Kepulauan Bangka Belitung',
  Banten: 'Banten',
  Bengkulu: 'Bengkulu',
  'Central Java': 'Jawa Tengah',
  'Central Kalimantan': 'Kalimantan Tengah',
  'Central Sulawesi': 'Sulawesi Tengah',
  'East Java': 'Jawa Timur',
  'East Kalimantan': 'Kalimantan Timur',
  'East Nusa Tenggara': 'Nusa Tenggara Timur',
  Gorontalo: 'Gorontalo',
  'Jakarta Special Capital Region': 'DKI Jakarta',
  Jambi: 'Jambi',
  Lampung: 'Lampung',
  Maluku: 'Maluku',
  'North Kalimantan': 'Kalimantan Utara',
  'North Maluku': 'Maluku Utara',
  'North Sulawesi': 'Sulawesi Utara',
  'North Sumatra': 'Sumatera Utara',
  Papua: 'Papua',
  Riau: 'Riau',
  'Riau Islands': 'Kepulauan Riau',
  'South Kalimantan': 'Kalimantan Selatan',
  'South Sulawesi': 'Sulawesi Selatan',
  'South Sumatra': 'Sumatera Selatan',
  'Southeast Sulawesi': 'Sulawesi Tenggara',
  'Special Region of Yogyakarta': 'DI Yogyakarta',
  'West Java': 'Jawa Barat',
  'West Kalimantan': 'Kalimantan Barat',
  'West Nusa Tenggara': 'Nusa Tenggara Barat',
  'West Papua': 'Papua Barat',
  'West Sulawesi': 'Sulawesi Barat',
  'West Sumatra': 'Sumatera Barat',
}

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ── Geometri ──
const poligon = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
const luasCincin = (r) => {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1])
  return Math.abs(a / 2)
}
function titikTengah(g) {
  // Titik tengah luas dari cincin luar poligon terbesar.
  const r = poligon(g)
    .map((pg) => pg[0])
    .sort((a, b) => luasCincin(b) - luasCincin(a))[0]
  let x = 0
  let y = 0
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]
    x += (r[j][0] + r[i][0]) * f
    y += (r[j][1] + r[i][1]) * f
    a += f
  }
  return a ? [y / (3 * a), x / (3 * a)] : [r[0][1], r[0][0]] // [lat, lng]
}
function dalamCincin([x, y], r) {
  let ok = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++)
    if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0])
      ok = !ok
  return ok
}
const dalamGeom = (pt, g) =>
  poligon(g).some((pg) => dalamCincin(pt, pg[0]) && !pg.slice(1).some((h) => dalamCincin(pt, h)))

function dp(titik, tol) {
  if (titik.length < 4) return titik
  const [a, b] = [titik[0], titik.at(-1)]
  let maks = 0
  let idx = 0
  for (let i = 1; i < titik.length - 1; i++) {
    const [x, y] = titik[i]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const d =
      dx || dy
        ? Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy)
        : Math.hypot(x - a[0], y - a[1])
    if (d > maks) ((maks = d), (idx = i))
  }
  return maks > tol ? [...dp(titik.slice(0, idx + 1), tol).slice(0, -1), ...dp(titik.slice(idx), tol)] : [a, b]
}
const bulat = (n) => Math.round(n * 1000) / 1000
/** Sederhanakan geometri: buang pulau sangat kecil, Douglas–Peucker, bulatkan 3 desimal (±100 m). */
function sederhana(g, tol, luasMin) {
  const hasil = []
  for (const pg of poligon(g)) {
    if (luasCincin(pg[0]) < luasMin) continue
    const cincin = pg
      .slice(0, 1) // lubang diabaikan untuk peta ekstrusi
      .map((r) => dp(r, tol).map(([x, y]) => [bulat(x), bulat(y)]))
      .filter((r) => r.length >= 4)
    if (cincin.length) hasil.push(cincin)
  }
  if (!hasil.length) {
    // pastikan wilayah kecil (mis. kota) tetap tergambar: ambil poligon terbesar
    const besar = poligon(g).sort((a, b) => luasCincin(b[0]) - luasCincin(a[0]))[0]
    hasil.push([dp(besar[0], tol / 4).map(([x, y]) => [bulat(x), bulat(y)])])
  }
  return { type: 'MultiPolygon', coordinates: hasil }
}

// ── Bangun ──
const adm1 = baca('IDN-ADM1.geojson').features
// Fitur ADM2 BPS yang bukan kab/kota (waduk, hutan, danau) ⇒ 519 − 5 = 514 kab/kota resmi.
const BUKAN_KABKOTA = new Set(['Waduk Cirata', 'Wadung Kedungombo', 'Hutan', 'Danau', 'Danau Toba'])
const adm2 = baca('IDN-ADM2.geojson').features.filter((f) => !BUKAN_KABKOTA.has(f.properties.shapeName))

const provinsi = adm1
  .map((f) => {
    const nama = NAMA_PROVINSI[f.properties.shapeName] ?? f.properties.shapeName
    const [lat, lng] = titikTengah(f.geometry)
    return { id: slug(nama), nama, iso: f.properties.shapeISO, lat: bulat(lat), lng: bulat(lng), _g: f.geometry }
  })
  .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))

function provinsiUntuk(g) {
  // Voting beberapa titik batas + titik tengah agar kab/kota pesisir tetap masuk provinsi yang benar.
  const r = poligon(g).sort((a, b) => luasCincin(b[0]) - luasCincin(a[0]))[0][0]
  const [lat, lng] = titikTengah(g)
  const sampel = [[lng, lat], ...Array.from({ length: 12 }, (_, i) => r[Math.floor((i * r.length) / 12)])]
  const suara = new Map()
  for (const pt of sampel)
    for (const pv of provinsi) if (dalamGeom(pt, pv._g)) suara.set(pv.id, (suara.get(pv.id) ?? 0) + 1)
  if (suara.size) return [...suara].sort((a, b) => b[1] - a[1])[0][0]
  // cadangan: provinsi dengan titik tengah terdekat
  return provinsi.reduce((m, pv) =>
    Math.hypot(pv.lat - lat, pv.lng - lng) < Math.hypot(m.lat - lat, m.lng - lng) ? pv : m,
  ).id
}

const kabkota = adm2
  .map((f) => {
    const nama = f.properties.shapeName
    const jenis = nama.startsWith('Kota ') && nama !== 'Kota Baru' ? 'Kota' : 'Kabupaten'
    const [lat, lng] = titikTengah(f.geometry)
    return {
      id: jenis === 'Kota' ? slug(nama) : slug(nama === 'Kota Baru' ? 'Kotabaru' : nama),
      nama: jenis === 'Kota' ? nama : `Kab. ${nama === 'Kota Baru' ? 'Kotabaru' : nama}`,
      jenis,
      provinsiId: provinsiUntuk(f.geometry),
      lat: bulat(lat),
      lng: bulat(lng),
      _g: f.geometry,
    }
  })
  .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))

const idUnik = new Set()
for (const k of kabkota) {
  if (idUnik.has(k.id)) k.id = `${k.id}-${k.provinsiId}`
  idUnik.add(k.id)
}

const nasional = {
  versi: '2026.11.08',
  diperbarui: '2026-11-08',
  sumber: {
    provinsi: {
      nama: 'geoBoundaries IDN ADM1 (OpenStreetMap, Wambacher), 2017',
      lisensi: 'ODbL 1.0',
      url: 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM1/',
    },
    kabkota: {
      nama: 'geoBoundaries IDN ADM2 (BPS, WFP, OCHA ROAP), 2020',
      lisensi: 'CC BY 3.0 IGO',
      url: 'https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/',
    },
  },
  catatan:
    'Batas 34 provinsi sebelum pemekaran Papua 2022. Profil risiko kab/kota di luar pilot Bandung Raya adalah ILUSTRASI.',
  provinsi: provinsi.map(({ _g, ...x }) => ({
    ...x,
    jumlahKabkota: kabkota.filter((k) => k.provinsiId === x.id).length,
  })),
  kabkota: kabkota.map(({ _g, ...x }) => x),
}
writeFileSync(p('../processed/nasional.json'), JSON.stringify(nasional, null, 1) + '\n')

const keluar = p('../../apps/web/public/geo/')
mkdirSync(`${keluar}kabkota`, { recursive: true })
const fc = (fitur) => ({ type: 'FeatureCollection', features: fitur })
const tulisGeo = (f, isi) => {
  const s = JSON.stringify(isi)
  writeFileSync(f, s)
  return s.length
}

let total = tulisGeo(
  `${keluar}provinsi.json`,
  fc(
    provinsi.map((pv) => ({
      type: 'Feature',
      properties: { id: pv.id, nama: pv.nama },
      geometry: sederhana(pv._g, 0.02, 0.004),
    })),
  ),
)
console.log(`provinsi.json  ${(total / 1024).toFixed(0)} KB`)
let totalKk = 0
for (const pv of provinsi) {
  const fitur = kabkota
    .filter((k) => k.provinsiId === pv.id)
    .map((k) => ({
      type: 'Feature',
      properties: { id: k.id, nama: k.nama, jenis: k.jenis },
      geometry: sederhana(k._g, 0.004, 0.0003),
    }))
  totalKk += tulisGeo(`${keluar}kabkota/${pv.id}.json`, fc(fitur))
}
console.log(`kabkota/*.json ${(totalKk / 1024).toFixed(0)} KB total (${provinsi.length} file)`)
console.log(`✓ ${provinsi.length} provinsi, ${kabkota.length} kab/kota → data/processed/nasional.json`)
const tanpa = provinsi.filter((pv) => !kabkota.some((k) => k.provinsiId === pv.id))
if (tanpa.length) console.warn('⚠ provinsi tanpa kab/kota:', tanpa.map((x) => x.nama).join(', '))
