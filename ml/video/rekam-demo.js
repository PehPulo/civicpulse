// PEMILIK: Ezra · Rekaman layar ASLI website CivicPulse: 10 percobaan warga melapor dari beranda.
// Tiap percobaan: buka beranda → tekan "Lapor Sekarang" → unggah foto → computer vision (CLIP) memilih jenis
// masalah & mendraf deskripsi → lokasi → kirim → skor prioritas.
//
//   npm run build -w @civicpulse/web && node ml/video/rekam-demo.js   → ml/reports/video-demo-lapor.mp4
// Butuh Google Chrome dan ffmpeg. Model AI diunduh sekali saat pemanasan (tidak ikut terekam).
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { KATEGORI } from '../../packages/core/src/kategori.js'

const akar = (p) => fileURLToPath(new URL(p, import.meta.url))
const percobaan = JSON.parse(readFileSync(akar('../reports/percobaan.json'), 'utf8')).percobaan
const wilayah = JSON.parse(readFileSync(akar('../../data/processed/wilayah.json'), 'utf8')).wilayah
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p))
const PORT = 4179
const URL_WEB = `http://localhost:${PORT}`
const tidur = (ms) => new Promise((r) => setTimeout(r, ms))

// Server pratinjau dari hasil build (apps/web/dist).
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: akar('../../apps/web'),
  shell: true,
  stdio: 'ignore',
})
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(URL_WEB)).ok) break
  } catch {
    // server belum siap, coba lagi
  }
  await tidur(500)
}

// Profil tetap agar cache model AI tidak diunduh ulang tiap kali skrip dijalankan.
const profil = join(tmpdir(), 'civicpulse-rekam-profil')
mkdirSync(profil, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: profil,
  protocolTimeout: 0,
  defaultViewport: { width: 1280, height: 800 },
  args: ['--window-size=1280,800', '--hide-scrollbars'],
})
await browser.defaultBrowserContext().overridePermissions(URL_WEB, ['geolocation'])
const page = await browser.newPage()
page.setDefaultTimeout(240000)

// Kursor tiruan + label percobaan agar penonton bisa mengikuti klik (headless tidak menggambar kursor).
await page.evaluateOnNewDocument(() => {
  addEventListener('DOMContentLoaded', () => {
    const k = document.createElement('div')
    k.id = '__kursor'
    k.style.cssText =
      'position:fixed;z-index:99999;left:-50px;top:-50px;width:22px;height:22px;pointer-events:none;transition:transform .08s;' +
      'background:url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><path d=%22M3 2l7 19 2.5-8L21 10z%22 fill=%22black%22 stroke=%22white%22 stroke-width=%221.5%22/></svg>") no-repeat'
    document.body.appendChild(k)
    addEventListener('mousemove', (e) => {
      k.style.left = e.clientX - 3 + 'px'
      k.style.top = e.clientY - 2 + 'px'
    })
    addEventListener('mousedown', () => (k.style.transform = 'scale(.8)'))
    addEventListener('mouseup', () => (k.style.transform = ''))
    const lbl = document.createElement('div')
    lbl.id = '__label'
    lbl.style.cssText =
      'position:fixed;z-index:99998;right:12px;bottom:12px;background:rgba(15,31,46,.85);color:#fff;font:600 13px system-ui;padding:6px 10px;border-radius:8px;pointer-events:none'
    lbl.textContent = sessionStorage.getItem('__label') ?? ''
    if (lbl.textContent) document.body.appendChild(lbl)
  })
})
const label = (teks) =>
  page.evaluate((t) => {
    sessionStorage.setItem('__label', t)
    const l = document.getElementById('__label')
    if (l) l.textContent = t
    else {
      const d = document.createElement('div')
      d.id = '__label'
      d.style.cssText =
        'position:fixed;z-index:99998;right:12px;bottom:12px;background:rgba(15,31,46,.85);color:#fff;font:600 13px system-ui;padding:6px 10px;border-radius:8px;pointer-events:none'
      d.textContent = t
      document.body.appendChild(d)
    }
  }, teks)

let posisi = { x: 640, y: 400 }
async function klik(el) {
  console.log('  klik:', (await el.evaluate((n) => n.textContent.trim().slice(0, 40))) || '(elemen)')
  await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  await tidur(500)
  const b = await el.boundingBox()
  const tujuan = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  await page.mouse.move(posisi.x, posisi.y)
  await page.mouse.move(tujuan.x, tujuan.y, { steps: 25 })
  posisi = tujuan
  await tidur(250)
  await page.mouse.down()
  await tidur(90)
  await page.mouse.up()
}
const tombol = (teks) =>
  page.waitForSelector(
    `::-p-xpath(//button[contains(normalize-space(.), "${teks}")] | //a[contains(normalize-space(.), "${teks}")])`,
    { visible: true },
  )
const tungguAktif = (teks) =>
  page.waitForFunction(
    (t) => [...document.querySelectorAll('button')].some((b) => b.textContent.includes(t) && !b.disabled),
    {},
    teks,
  )

async function satuPercobaan(p, i, total) {
  const w = wilayah.find((x) => x.kecamatan === p.wilayah.kecamatan) ?? wilayah[0]
  await page.setGeolocation({ latitude: w.lat + 0.0012, longitude: w.lng + 0.0009 })
  await page.goto(URL_WEB, { waitUntil: 'networkidle0' })
  // Tiap percobaan = warga berbeda: kosongkan data lokal (termasuk batas 5 laporan/hari per perangkat).
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
  await label(`Percobaan ${i + 1}/${total} · computer vision`)
  await tidur(1500)
  // Beranda → Lapor Sekarang (tombol di hero)
  await klik(await page.waitForSelector('main a[href="/lapor"]', { visible: true }))
  await page.waitForSelector('input[type="file"]')
  await tidur(1200)
  // Unggah foto: tunjuk area unggah, lalu pilih file
  await klik(await page.waitForSelector('label:has(input[type="file"])'))
  await (await page.$('input[type="file"]')).uploadFile(akar(`../eval/images/${p.file}`))
  // Computer vision: tunggu analisis selesai. Bila AI kurang yakin (< ambang saran), kategori tidak dipilihkan,
  // jadi kursor memilih kategori yang benar seperti warga sungguhan.
  await page.waitForFunction(
    () => /AI mengenali foto ini|foto ini lebih mirip|AI belum yakin/.test(document.body.innerText),
    { polling: 500 },
  )
  await tidur(1500)
  if (!(await page.$('button[aria-pressed="true"]'))) {
    const label = KATEGORI.find((k) => k.id === p.labelAsli).label
    await klik(await page.waitForSelector(`::-p-xpath(//fieldset//button[.//span[normalize-space(.)="${label}"]])`))
  }
  await tungguAktif('Lanjut')
  await tidur(2500)
  await klik(await tombol('Lanjut'))
  await tidur(1000)
  await klik(await tombol('Pakai lokasi saya'))
  await tungguAktif('Lanjut')
  await tidur(2500) // draf deskripsi otomatis terlihat
  const deskripsi = await page.$('textarea')
  if (deskripsi) await deskripsi.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  await tidur(2000)
  await klik(await tombol('Lanjut'))
  await tidur(2500) // pratinjau skor
  await klik(await tombol('Kirim laporan'))
  await page.waitForFunction(() => document.body.innerText.includes('Laporan berhasil dikirim'))
  await tidur(2000)
  // Halaman hasil: skor prioritas beserta alasannya
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }))
  await tidur(3500)
  await tidur(4500)
}

// Pemanasan (tidak direkam): unduh & cache model CLIP sekali.
console.log('Pemanasan: mengunduh model AI ke profil Chrome sementara…')
const aman = (fn) =>
  fn().catch(async (e) => {
    await page.screenshot({ path: join(tmpdir(), 'civicpulse-rekam-gagal.png') }).catch(() => {})
    console.error('Gagal; tangkapan layar: ' + join(tmpdir(), 'civicpulse-rekam-gagal.png'))
    throw e
  })
await aman(() => satuPercobaan(percobaan[0], 0, percobaan.length))
await page.evaluate(() => localStorage.clear())

const webm = join(profil, 'rekaman.webm')
const perekam = await page.screencast({ path: webm })
for (const [i, p] of percobaan.entries()) {
  console.log(`Merekam percobaan ${i + 1}/${percobaan.length}: ${p.file}`)
  await aman(() => satuPercobaan(p, i, percobaan.length))
}
await perekam.stop()
await browser.close()
server.kill()

const keluar = akar('../reports/video-demo-lapor.mp4')
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    webm,
    '-vf',
    'fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-crf',
    '24',
    '-movflags',
    '+faststart',
    keluar,
  ],
  {
    stdio: 'ignore',
  },
)
rmSync(webm, { force: true })
console.log(`✔ ${keluar}`)
