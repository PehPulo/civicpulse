// Validasi data/processed/wilayah.json terhadap kontrak (docs/DATA-MODEL.md).
// Tanpa dependensi agar bisa jalan di CI mana pun: `npm run data:validate`.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const path = fileURLToPath(new URL('../processed/wilayah.json', import.meta.url))
const data = JSON.parse(readFileSync(path, 'utf8'))
const galat = []
const cek = (kondisi, pesan) => kondisi || galat.push(pesan)

for (const k of ['versi', 'diperbarui', 'sumber', 'wilayah']) cek(k in data, `field root "${k}" wajib ada`)
cek(typeof data.ilustrasi === 'boolean', 'field "ilustrasi" wajib boolean')
cek(Array.isArray(data.wilayah) && data.wilayah.length > 0, '"wilayah" wajib array tidak kosong')

const ids = new Set()
for (const [i, w] of (data.wilayah ?? []).entries()) {
  const at = `wilayah[${i}] (${w.id ?? '?'})`
  cek(/^[a-z0-9-]+$/.test(w.id ?? ''), `${at}: id harus kebab-case`)
  cek(!ids.has(w.id), `${at}: id duplikat`)
  ids.add(w.id)
  cek(typeof w.kecamatan === 'string' && typeof w.kabupaten === 'string', `${at}: kecamatan/kabupaten wajib string`)
  cek(w.lat >= -11 && w.lat <= 6 && w.lng >= 95 && w.lng <= 141, `${at}: koordinat di luar Indonesia`)
  cek(w.miskin >= 0 && w.miskin <= 100, `${at}: miskin harus 0–100`)
  for (const b of ['banjir', 'longsor', 'jalan']) {
    cek(w.risiko?.[b] >= 0 && w.risiko?.[b] <= 100, `${at}: risiko.${b} harus 0–100`)
    if (w.kejadian5th !== null)
      cek(Number.isInteger(w.kejadian5th?.[b]) && w.kejadian5th[b] >= 0, `${at}: kejadian5th.${b} harus integer ≥ 0`)
  }
  // kejadian5th boleh null hanya selama data DIBI belum dimuat (sumber.dibi.url kosong).
  if (w.kejadian5th === null) cek(!data.sumber?.dibi?.url, `${at}: kejadian5th null padahal sumber.dibi.url terisi`)
}

if (!data.ilustrasi) {
  for (const s of ['irbi', 'bps']) cek(data.sumber?.[s]?.url, `sumber.${s}.url wajib diisi untuk data asli`)
  const adaKejadian = (data.wilayah ?? []).some((w) => w.kejadian5th !== null)
  if (adaKejadian) cek(data.sumber?.dibi?.url, 'sumber.dibi.url wajib diisi bila kejadian5th berisi angka')
}

if (galat.length) {
  console.error(`✖ wilayah.json tidak valid (${galat.length} galat):\n  - ${galat.join('\n  - ')}`)
  process.exit(1)
}
console.log(`✔ wilayah.json valid: ${data.wilayah.length} wilayah${data.ilustrasi ? ' (masih DATA ILUSTRASI)' : ''}`)
