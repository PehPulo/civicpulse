// Uji ujung-ke-ujung fitur "CCTV publik terdekat" untuk pengecek/juri.
//   1. Membuat laporan uji tepat di dekat kamera CCTV publik nyata (lewat api.js aplikasi, jadi bekerja di mode
//      lokal maupun HTTP).
//   2. Login sebagai admin kab/kota pemilik wilayah, membuka meja kerja laporan itu.
//   3. Memeriksa panel CCTV menampilkan kamera ≤ 1 km dan draf permintaan rekaman memuat kode laporan.
//
// Prasyarat: `npm run dev` (web di http://localhost:5173) + Google Chrome.
// Jalankan:  npm run uji:cctv            (tanpa jendela)
//            npm run uji:cctv -- --lihat (membuka Chrome & membiarkannya terbuka untuk dilihat)
// Chrome lain: set CHROME=/path/ke/chrome
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const WEB = process.env.WEB_URL ?? 'http://localhost:5173'
const LIHAT = process.argv.includes('--lihat')
const CHROME =
  process.env.CHROME ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find(existsSync)

// Titik uji ±100–150 m dari kamera nyata di data/processed/cctv.json.
const KASUS = [
  {
    kota: 'Kota Bandung',
    akun: 'admin.kota-bandung',
    kamera: 'Tamblong - Asia Afrika',
    lat: -6.9228,
    lng: 107.6107,
    kategoriId: 'jalan',
    judul: '[UJI CCTV] Jalan berlubang dekat Simpang Asia Afrika',
  },
  {
    kota: 'Kota Malang',
    akun: 'admin.kota-malang',
    kamera: 'Jl. Letjen S. Parman Arah Utara',
    lat: -7.9527,
    lng: 112.6401,
    kategoriId: 'drainase',
    judul: '[UJI CCTV] Saluran tersumbat di Jl. Letjen S. Parman',
  },
  {
    kota: 'Kota Semarang',
    akun: 'admin.kota-semarang',
    kamera: 'Thamrin Pandanaran 360',
    lat: -6.9885,
    lng: 110.418,
    kategoriId: 'banjir',
    judul: '[UJI CCTV] Genangan di Jl. Pandanaran',
  },
]

if (!CHROME) {
  console.error('Chrome tidak ditemukan. Set variabel CHROME=/path/ke/chrome.')
  process.exit(2)
}
try {
  await fetch(WEB)
} catch {
  console.error(`Web belum jalan di ${WEB}. Jalankan "npm run dev" dulu.`)
  process.exit(2)
}

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: LIHAT ? false : 'new',
  defaultViewport: LIHAT ? null : { width: 1400, height: 1000 },
})
const page = await browser.newPage()
const galatJs = []
page.on('pageerror', (e) => galatJs.push(e.message))

// Tunggu layar muat logo (index.html) hilang agar klik tidak tertahan overlay.
const siap = () => page.waitForFunction(() => !document.getElementById('muat'), { timeout: 10000 })
await page.goto(WEB, { waitUntil: 'networkidle2' })
await siap()
const hasil = []

for (const k of KASUS) {
  const baris = { ...k, kode: null, lulus: false, catatan: '' }
  try {
    // 1. Laporan warga baru (perangkat uji baru agar tidak terkena batas harian).
    baris.kode = await page.evaluate(async (k) => {
      localStorage.removeItem('civicpulse:device')
      const { api } = await import('/src/services/api.js')
      api.logoutInstansi()
      const l = await api.buatLaporan({
        kategoriId: k.kategoriId,
        lat: k.lat,
        lng: k.lng,
        judul: k.judul,
        deskripsi: `Laporan uji otomatis fitur CCTV publik terdekat (kamera ${k.kamera}). Boleh diabaikan.`,
      })
      return l.kode
    }, k)

    // 2. Login admin kab/kota lewat halaman masuk.
    await page.goto(`${WEB}/instansi/masuk`, { waitUntil: 'networkidle2' })
    await siap()
    await page.type('#username-instansi', k.akun)
    await page.type('#sandi-instansi', 'civicpulse2026')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
      page.click('button[type=submit]'),
    ])

    if (page.url().includes('/instansi/masuk')) {
      const g = await page.$eval('#galat-masuk', (e) => e.textContent).catch(() => 'tidak diketahui')
      throw new Error(`login ${k.akun} gagal: ${g} (batas login server 10×/15 menit per IP; restart API bila perlu)`)
    }

    // 3. Meja kerja laporan → panel CCTV.
    await page.goto(`${WEB}/instansi/laporan/${baris.kode}`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(
      () => [...document.querySelectorAll('h2,h3')].some((h) => h.textContent.includes('CCTV publik')),
      { timeout: 10000 },
    )
    const panel = await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2,h3')].find((x) => x.textContent.includes('CCTV publik'))
      h.scrollIntoView({ block: 'start' })
      return h.parentElement.parentElement.innerText
    })
    const jarak = [...panel.matchAll(/±(\d+) m/g)].map((m) => Number(m[1]))
    const adaKamera = panel.includes(k.kamera)
    const dalam1km = jarak.length > 0 && Math.min(...jarak) <= 1000 && !panel.includes('Tidak ada kamera dalam')

    // 4. Draf permintaan rekaman.
    for (const b of await page.$$('button'))
      if ((await b.evaluate((x) => x.textContent)).includes('Susun permintaan')) {
        await b.evaluate((x) => x.click())
        break
      }
    await tunggu(300)
    const draf = await page.$eval('#draf-cctv', (e) => e.value).catch(() => '')
    const drafOk = draf.includes(baris.kode) && draf.includes('Rentang waktu') && draf.includes(k.kamera)

    baris.lulus = adaKamera && dalam1km && drafOk
    baris.catatan = `kamera terdekat ±${Math.min(...jarak)} m · ${jarak.length} kamera ≤1 km · draf ${drafOk ? 'OK' : 'GAGAL'}`
    if (!adaKamera) baris.catatan += ` · kamera "${k.kamera}" tidak muncul`
    if (!drafOk) baris.catatan += ` · isi draf: ${JSON.stringify(draf.slice(0, 160))}`
  } catch (e) {
    baris.catatan = `galat: ${e.message.split('\n')[0]}`
  }
  hasil.push(baris)
  console.log(`${baris.lulus ? '✅ LULUS' : '❌ GAGAL'}  ${k.kota.padEnd(14)} ${baris.kode ?? '-'}  ${baris.catatan}`)
  console.log(`         ${WEB}/instansi/laporan/${baris.kode}  (login ${k.akun} / civicpulse2026)`)
  if (LIHAT) await tunggu(2500)
}

if (galatJs.length) console.log('Galat JS di halaman:', galatJs)
const lulus = hasil.filter((h) => h.lulus).length
console.log(`\n${lulus}/${hasil.length} kasus lulus.`)
if (LIHAT) {
  console.log('Chrome dibiarkan terbuka di laporan terakhir. Tutup jendelanya untuk selesai.')
  await new Promise((r) => browser.on('disconnected', r))
} else await browser.close()
process.exit(lulus === hasil.length && !galatJs.length ? 0 : 1)
