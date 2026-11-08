// PEMILIK: Ezra · Coba computer vision (CLIP) pada foto apa pun, dengan model & label yang SAMA dengan browser.
//
//   npm run ai:foto -- path/ke/foto.jpg [kategori]
//
// Menampilkan 3 tebakan kategori teratas, detail kondisi untuk kategori teratas (bahan draf deskripsi),
// dan bila [kategori] diisi: apakah foto itu tampak "sudah beres" (dipakai saat verifikasi).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline, RawImage } from '@huggingface/transformers'

const [file, kategoriVerifikasi] = process.argv.slice(2)
if (!file) {
  console.log('Pakai: npm run ai:foto -- path/ke/foto.jpg [kategori untuk cek verifikasi]')
  process.exit(1)
}
const registry = JSON.parse(readFileSync(fileURLToPath(new URL('./models.json', import.meta.url)), 'utf8'))
const cfg = registry.model[registry.aktif.vision]
const pct = (x) => `${(x * 100).toFixed(1)}%`

console.log(`Memuat ${cfg.hfId} (${registry.aktif.vision})… (unduhan pertama ±90 MB)`)
const clf = await pipeline(cfg.pipeline, cfg.hfId, { dtype: cfg.dtype })
const img = await RawImage.read(resolve(process.cwd(), file))

const label = cfg.label.klasifikasi
const kategori = Object.keys(label)
const t = performance.now()
const out = await clf(img, Object.values(label))
const peringkat = out.map((o) => ({ id: kategori[Object.values(label).indexOf(o.label)], yakin: o.score }))
console.log(`\nKategori (${Math.round(performance.now() - t)} ms):`)
for (const p of peringkat.slice(0, 3)) console.log(`  ${p.id.padEnd(9)} ${pct(p.yakin)}`)
console.log(
  peringkat[0].yakin >= 0.6
    ? `  ⇒ di aplikasi: "${peringkat[0].id}" dipilihkan otomatis`
    : '  ⇒ di aplikasi: keyakinan < 60%, warga memilih kategori sendiri',
)

const daftar = cfg.label.detail?.[peringkat[0].id] ?? []
if (daftar.length) {
  const det = await clf(
    img,
    daftar.map((d) => d.prompt),
  )
  console.log(`\nDetail kondisi (${peringkat[0].id}):`)
  for (const o of det.slice(0, 3))
    console.log(`  ${pct(o.score).padStart(6)}  ${daftar.find((d) => d.prompt === o.label).kalimat}`)
}

if (kategoriVerifikasi) {
  const v = cfg.label.verifikasi[kategoriVerifikasi] ?? cfg.label.verifikasi.lainnya
  const hasil = await clf(img, [v.beres, v.belum])
  const beres = hasil.find((o) => o.label === v.beres).score
  console.log(
    `\nVerifikasi (${kategoriVerifikasi}): ${beres >= 0.5 ? 'tampak SUDAH beres' : 'tampak BELUM beres'} (${pct(Math.max(beres, 1 - beres))} yakin)`,
  )
}
