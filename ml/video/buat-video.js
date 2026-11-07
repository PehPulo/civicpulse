// PEMILIK: Ezra · Membuat video demo 10 percobaan AI (computer vision + LLM) dari ml/reports/percobaan.json.
//   node ml/video/buat-video.js   → ml/reports/video-percobaan.mp4
// Butuh: Google Chrome (headless, untuk merender slide) dan ffmpeg di PATH.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const akar = (p) => fileURLToPath(new URL(p, import.meta.url))
const data = JSON.parse(readFileSync(akar('../reports/percobaan.json'), 'utf8'))
const evalClip = JSON.parse(readFileSync(akar(`../reports/${data.vision}.json`), 'utf8'))
const sumber = Object.fromEntries(
  readFileSync(akar('../eval/sumber.csv'), 'utf8')
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.match(/"((?:[^"]|"")*)"/g).map((x) => x.slice(1, -1).replaceAll('""', '"')))
    .map((r) => [r[0], { penulis: r[3], lisensi: r[4] }]),
)
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p))
if (!CHROME) throw new Error('Chrome tidak ditemukan; set env CHROME')

const KERJA = join(tmpdir(), `civicpulse-video-${Date.now()}`)
mkdirSync(KERJA, { recursive: true })
const LABEL = {
  drainase: 'Drainase tersumbat',
  banjir: 'Banjir / genangan',
  jalan: 'Jalan rusak',
  longsor: 'Longsor',
  lainnya: 'Fasilitas umum rusak',
}
const pct = (x) => `${Math.round(x * 100)}%`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const gaya = `
*{box-sizing:border-box;margin:0}body{width:1280px;height:720px;font-family:'Segoe UI',system-ui,sans-serif;background:#f7f5f0;color:#0f1f2e;overflow:hidden}
.top{height:56px;background:#0f6b5c;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 32px;font-weight:700}
.top small{font-weight:500;opacity:.85}
.isi{display:grid;grid-template-columns:520px 1fr;gap:28px;padding:24px 32px}
.foto{width:520px;height:390px;object-fit:cover;border-radius:16px;border:1px solid #e4e1d8;background:#fff}
.kred{font-size:11px;color:#8494a5;margin-top:6px}
.kartu{background:#fff;border:1px solid #e4e1d8;border-radius:16px;padding:16px 18px;margin-bottom:14px}
.judul{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0f6b5c;margin-bottom:8px}
.bar{display:grid;grid-template-columns:170px 1fr 48px;align-items:center;gap:10px;font-size:14px;margin:5px 0}
.bar div{height:10px;border-radius:5px;background:#e4e1d8}.bar div span{display:block;height:10px;border-radius:5px;background:#2a78d6}
.bar.utama div span{background:#0f6b5c}.bar b{text-align:right;font-variant-numeric:tabular-nums}
.ok{color:#3f7d4e;font-weight:700}.no{color:#c2410c;font-weight:700}
.llm{font-size:16px;line-height:1.45}
.meta{font-size:12px;color:#47586a;margin-top:8px}
.tengah{display:flex;flex-direction:column;align-items:center;justify-content:center;height:664px;text-align:center;padding:0 80px}
.besar{font-size:44px;font-weight:800;letter-spacing:-.02em}
.angka{display:flex;gap:24px;margin-top:32px}.angka .kartu{width:230px;padding:22px}.angka b{font-size:40px;display:block;color:#0f6b5c}
`
const halaman = (isi) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${gaya}</style></head><body>${isi}</body></html>`
const atas = (kiri, kanan) => `<div class="top"><span>${kiri}</span><small>${kanan}</small></div>`

const slide = []
slide.push({
  detik: 4,
  html: halaman(`${atas('CivicPulse · Uji AI di perangkat', data.tanggal)}
  <div class="tengah"><p class="judul">10 percobaan ujung ke ujung</p>
  <p class="besar">Foto warga → Computer Vision (CLIP) → LLM (Qwen2.5)</p>
  <p class="meta" style="font-size:18px;margin-top:18px">Setiap percobaan: CLIP menebak jenis masalah &amp; kondisi dari foto asli,
  lalu LLM menulis ringkasan laporan untuk instansi. Pengaman angka menolak teks LLM yang memuat angka di luar fakta.</p>
  <p class="meta" style="margin-top:14px">Model: ${esc(data.vision)} (Xenova/clip-vit-base-patch32, q8) · ${esc(data.llm)} (Qwen2.5-0.5B-Instruct, q4) · dijalankan lokal, tanpa server AI</p></div>`),
})

for (const p of data.percobaan) {
  const foto = pathToFileURL(akar(`../eval/images/${p.file}`)).href
  const kr = sumber[p.file] ?? {}
  slide.push({
    detik: 7,
    html: halaman(`${atas(`Percobaan ${p.no} / ${data.percobaan.length}`, `Lokasi uji: Kec. ${esc(p.wilayah.kecamatan)}, ${esc(p.wilayah.kabupaten)} (data BNPB & BPS asli)`)}
    <div class="isi"><div><img class="foto" src="${foto}"><p class="kred">Foto: ${esc(kr.penulis ?? '-').slice(0, 80)} · ${esc(kr.lisensi ?? '')} · Wikimedia Commons</p>
      <div class="kartu" style="margin-top:12px"><p class="judul">Label asli</p><p style="font-size:18px;font-weight:700">${LABEL[p.labelAsli]}</p>
      <p class="meta">Tebakan CLIP: <span class="${p.benar ? 'ok' : 'no'}">${LABEL[p.prediksi]} ${p.benar ? '✓ benar' : '✗ meleset'}</span></p></div></div>
    <div>
      <div class="kartu"><p class="judul">1 · Computer vision: jenis masalah</p>
        ${p.top3.map((t, i) => `<div class="bar ${i === 0 ? 'utama' : ''}"><span>${LABEL[t.kategoriId]}</span><div><span style="width:${Math.max(2, t.yakin * 100)}%"></span></div><b>${pct(t.yakin)}</b></div>`).join('')}
        <p class="judul" style="margin-top:12px">Kondisi terlihat</p>
        ${p.detail.map((d) => `<div class="bar"><span style="grid-column:span 2">${esc(d.kalimat)}</span><b>${pct(d.yakin)}</b></div>`).join('')}
        <p class="meta">CLIP ${p.ms.clip} ms · detail ${p.ms.detail} ms</p></div>
      <div class="kartu"><p class="judul">2 · LLM: ringkasan untuk instansi</p><p class="llm">${esc(p.llm)}</p>
        <p class="meta">Pengaman angka: <span class="${p.angkaAman ? 'ok' : 'no'}">${p.angkaAman ? '✓ lolos, semua angka ada di fakta' : '✗ ditolak, aplikasi memakai draf template'}</span> · LLM ${(p.ms.llm / 1000).toFixed(1)} s (CPU)</p></div>
    </div></div>`),
  })
}

const r = data.ringkasan
slide.push({
  detik: 6,
  html: halaman(`${atas('Hasil', data.tanggal)}
  <div class="tengah"><p class="besar">Ringkasan uji</p><div class="angka">
  <div class="kartu"><b>${r.clipBenar}/${r.jumlah}</b>CLIP benar di 10 percobaan</div>
  <div class="kartu"><b>${pct(evalClip.akurasiTop1)}</b>akurasi top-1 pada ${evalClip.jumlahFoto} foto uji</div>
  <div class="kartu"><b>${pct(evalClip.akurasiTop3)}</b>akurasi top-3</div>
  <div class="kartu"><b>${r.llmLolosPengaman}/${r.jumlah}</b>teks LLM lolos pengaman angka</div></div>
  <p class="meta" style="margin-top:28px;font-size:14px">Foto: Wikimedia Commons (lisensi CC/PD, atribusi di ml/eval/sumber.csv). Laporan lengkap: ml/reports/${esc(data.vision)}.md</p></div>`),
})

const daftar = []
for (const [i, s] of slide.entries()) {
  const html = join(KERJA, `s${i}.html`)
  const png = join(KERJA, `s${String(i).padStart(2, '0')}.png`)
  writeFileSync(html, s.html)
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--window-size=1280,720',
      `--screenshot=${png}`,
      pathToFileURL(html).href,
    ],
    { stdio: 'ignore' },
  )
  daftar.push(`file '${png.replaceAll('\\', '/')}'`, `duration ${s.detik}`)
}
daftar.push(daftar.at(-2)) // ffmpeg concat: frame terakhir diulang agar durasinya dihormati
writeFileSync(join(KERJA, 'daftar.txt'), daftar.join('\n'))
const keluar = akar('../reports/video-percobaan.mp4')
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    join(KERJA, 'daftar.txt'),
    '-vf',
    'fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-crf',
    '23',
    '-movflags',
    '+faststart',
    keluar,
  ],
  { stdio: 'ignore' },
)
rmSync(KERJA, { recursive: true, force: true })
console.log(`✔ ${keluar} (${slide.length} slide)`)
