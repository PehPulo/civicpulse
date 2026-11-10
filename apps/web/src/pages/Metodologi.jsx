// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md § /metodologi, docs/SCORING.md, docs/DATA.md
// Semua angka di halaman ini dibaca dari @civicpulse/core dan data/processed, TIDAK diketik ulang,
// sehingga halaman ini selalu sama dengan rumus yang benar-benar dipakai sistem.
// Tata letak editorial bernomor (01–06) + interaksi: daftar isi mengikuti posisi gulir, faktor skor & bilah bobot
// saling menyorot saat disentuh, skala prioritas, langkah verifikasi, dan sumber data bisa dibuka satu per satu.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, X } from 'lucide-react'
import {
  AMBANG,
  ATURAN_ANALITIK,
  ATURAN_LAPORAN,
  ATURAN_VERIFIKASI,
  BOBOT,
  KATEGORI,
  NORMALISASI,
  VERSI_RUMUS,
  hitungPrioritas,
} from '@civicpulse/core'
import { DATA_ILUSTRASI, SUMBER_DATA, WILAYAH } from '../lib/peta.js'
import { RincianFaktor } from '../components/Prioritas.jsx'
import { AMBANG_SARAN } from '../ai/index.js'
import registry from '../../../../ml/models.json'
import SampulHalaman from '../components/SampulHalaman.jsx'

const persen = (x) => `${Math.round(x * 100)}%`
const BAGIAN = [
  { id: 'skor', label: 'Skor prioritas' },
  { id: 'coba', label: 'Coba hitung' },
  { id: 'verifikasi', label: 'Verifikasi warga' },
  { id: 'kesenjangan', label: 'Wilayah Senyap' },
  { id: 'ai', label: 'Peran AI' },
  { id: 'data', label: 'Data & batasan' },
]

// Halaman ini sengaja dua warna (hijau & putih): faktor dibedakan gradasi hijau + nama, bukan warna lain.
const FAKTOR = [
  {
    kunci: 'risiko',
    nama: 'Risiko wilayah',
    warna: '#0a3d24',
    sumber: 'IRBI · BNPB',
    tanya: 'Seberapa rawan wilayah ini terhadap bahaya yang dilaporkan?',
    cara: 'Indeks risiko bencana kab/kota untuk bahaya yang sesuai kategori laporan, sudah berskala 0–100.',
  },
  {
    kunci: 'riwayat',
    nama: 'Riwayat kejadian',
    warna: '#055c34',
    sumber: 'DIBI · BNPB',
    tanya: 'Seberapa sering bencana ini benar-benar terjadi di sini?',
    cara: `Kejadian terkait dalam 5 tahun ÷ ${NORMALISASI.kejadianMaks} × 100 (maks. 100).`,
  },
  {
    kunci: 'kemiskinan',
    nama: 'Kerentanan sosial',
    warna: '#069550',
    sumber: 'Kemiskinan · BPS',
    tanya: 'Seberapa sulit warganya pulih bila terdampak?',
    cara: `(% penduduk miskin − ${NORMALISASI.miskinMin}) ÷ (${NORMALISASI.miskinMaks} − ${NORMALISASI.miskinMin}) × 100, dibatasi 0–100.`,
  },
  {
    kunci: 'serupa',
    nama: 'Laporan serupa',
    warna: '#3fb06e',
    sumber: 'Laporan warga',
    tanya: 'Berapa warga lain yang mengalami hal yang sama?',
    cara: `Laporan/+1 kategori sama dalam ${ATURAN_LAPORAN.serupaRadiusMeter} m & ${ATURAN_LAPORAN.serupaHari} hari ÷ ${NORMALISASI.serupaMaks} × 100 (maks. 100).`,
  },
]

const sumberAI = [registry.model[registry.aktif.vision], registry.model[registry.aktif.llm]]

/** Daftar isi mengikuti bagian yang sedang dibaca. */
function useBagianAktif() {
  const [aktif, setAktif] = useState(BAGIAN[0].id)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entri) => {
        const terlihat = entri
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (terlihat[0]) setAktif(terlihat[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    for (const b of BAGIAN) {
      const el = document.getElementById(b.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])
  return aktif
}

export default function Metodologi() {
  const aktif = useBagianAktif()
  return (
    <>
      <SampulHalaman
        halaman="metodologi"
        eyebrow="Transparansi"
        judul="Metodologi & Data"
        sub="Setiap angka di CivicPulse bisa dihitung ulang siapa saja. Halaman ini membaca rumus langsung dari kode yang dipakai sistem."
      />
      <section className="container-page py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[210px_1fr]">
          <nav aria-label="Daftar isi" className="lg:sticky lg:top-24 lg:self-start">
            <p className="hidden text-xs font-bold uppercase tracking-[0.14em] text-ink-faint lg:block">Isi halaman</p>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:mt-3 lg:flex-col lg:gap-0.5 lg:border-l lg:border-line lg:pb-0">
              {BAGIAN.map((b, i) => {
                const ini = aktif === b.id
                return (
                  <li key={b.id} className="shrink-0">
                    <a
                      href={`#${b.id}`}
                      aria-current={ini ? 'true' : undefined}
                      className={`group flex items-center gap-2.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-2 ${
                        ini
                          ? 'border-brand-600 bg-brand-50 font-bold text-brand-800 lg:bg-transparent'
                          : 'border-line bg-white text-ink-soft hover:border-brand-300 hover:text-ink lg:border-transparent lg:bg-transparent'
                      }`}
                    >
                      <span
                        className={`font-mono text-xs tabular-nums transition-colors ${ini ? 'text-brand-600' : 'text-ink-faint group-hover:text-brand-600'}`}
                      >
                        0{i + 1}
                      </span>
                      <span className="transition-transform group-hover:translate-x-0.5">{b.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
            <p className="mt-6 hidden text-xs text-ink-faint lg:block">
              Versi rumus <span className="font-mono font-bold text-ink">{VERSI_RUMUS}</span>
              {DATA_ILUSTRASI && <span className="mt-2 block tag-ilustrasi w-fit">Data wilayah ilustrasi</span>}
            </p>
          </nav>

          <div className="min-w-0 space-y-20">
            <Bagian id="skor" no="01" judul="Skor prioritas 0–100" lead="Empat pertanyaan, satu angka.">
              <SkorInteraktif />
            </Bagian>

            <Bagian
              id="coba"
              no="02"
              judul="Coba hitung sendiri"
              lead="Fungsi yang sama persis dengan sistem, langsung di browsermu."
            >
              <Kalkulator />
            </Bagian>

            <Bagian
              id="verifikasi"
              no="03"
              judul="“Selesai” harus dibuktikan warga"
              lead="Instansi tidak bisa menyatakan laporannya sendiri terverifikasi."
            >
              <LangkahVerifikasi />
            </Bagian>

            <Bagian id="kesenjangan" no="04" judul="Kesenjangan & Wilayah Senyap" lead="Sepi belum tentu aman.">
              <Kesenjangan />
            </Bagian>

            <Bagian
              id="ai"
              no="05"
              judul="Peran AI: membantu, bukan memutuskan"
              lead="AI ada di setiap langkah. Keputusan tetap pada rumus dan warga."
            >
              <PeranAi />
            </Bagian>

            <Bagian id="data" no="06" judul="Sumber data & batasan" lead="Dari mana angkanya, dan di mana kurangnya.">
              <SumberData />
            </Bagian>
          </div>
        </div>
      </section>
    </>
  )
}

function Bagian({ id, no, judul, lead, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-baseline gap-4 border-b border-line pb-4">
        <span
          className="font-display text-4xl font-extrabold tabular-nums text-brand-200 sm:text-5xl"
          aria-hidden="true"
        >
          {no}
        </span>
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{judul}</h2>
          {lead && <p className="mt-1 text-ink-soft">{lead}</p>}
        </div>
      </div>
      <div className="mt-6 leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}

/** Tingkat prioritas dalam gradasi hijau (makin tinggi makin pekat), selalu disertai nama level. */
const HIJAU_LEVEL = {
  Rendah: {
    latar: 'bg-white',
    garis: 'border-brand-200',
    teks: 'text-brand-600',
    lencana: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  },
  Sedang: {
    latar: 'bg-brand-50',
    garis: 'border-brand-300',
    teks: 'text-brand-700',
    lencana: 'bg-brand-200 text-brand-900',
  },
  Tinggi: {
    latar: 'bg-brand-100',
    garis: 'border-brand-600',
    teks: 'text-brand-900',
    lencana: 'bg-brand-800 text-white',
  },
}
const warnaLevel = (level) => HIJAU_LEVEL[level] ?? HIJAU_LEVEL.Rendah

// ── 01 Skor: bilah bobot + kartu faktor saling menyorot, skala level ──
function SkorInteraktif() {
  const [sorot, setSorot] = useState(null)
  const redup = (k) => (sorot && sorot !== k ? 'opacity-35' : 'opacity-100')
  return (
    <>
      <p className="max-w-2xl">
        Tiap faktor diubah ke skala 0–100, dikalikan bobotnya, lalu dijumlahkan. Sentuh atau arahkan kursor ke faktor
        untuk melihat cara hitungnya.
      </p>

      {/* bilah bobot */}
      <div className="mt-6" onMouseLeave={() => setSorot(null)}>
        <div className="flex h-12 gap-0.5 overflow-hidden rounded-xl" role="img" aria-label="Bobot faktor skor">
          {FAKTOR.map((f) => (
            <button
              key={f.kunci}
              type="button"
              onMouseEnter={() => setSorot(f.kunci)}
              onFocus={() => setSorot(f.kunci)}
              onClick={() => setSorot(sorot === f.kunci ? null : f.kunci)}
              className={`flex items-center justify-center text-sm font-extrabold text-white transition-all duration-300 ${redup(f.kunci)}`}
              style={{ width: persen(BOBOT[f.kunci]), background: f.warna }}
              aria-label={`${f.nama} ${persen(BOBOT[f.kunci])}`}
            >
              {BOBOT[f.kunci] >= 0.12 && <span className="drop-shadow">{persen(BOBOT[f.kunci])}</span>}
            </button>
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FAKTOR.map((f) => {
            const ini = sorot === f.kunci
            return (
              <li key={f.kunci}>
                <button
                  type="button"
                  onMouseEnter={() => setSorot(f.kunci)}
                  onFocus={() => setSorot(f.kunci)}
                  onClick={() => setSorot(ini ? null : f.kunci)}
                  className={`group relative h-full w-full overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(10,61,36,0.55)] ${
                    ini ? 'border-transparent shadow-[0_18px_40px_-24px_rgba(10,61,36,0.55)]' : 'border-line'
                  } ${redup(f.kunci)}`}
                  style={ini ? { boxShadow: `0 0 0 2px ${f.warna}` } : undefined}
                >
                  <span
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: f.warna }}
                    aria-hidden="true"
                  />
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-bold text-ink">{f.nama}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-ink-faint">{f.sumber}</span>
                    </span>
                    <span className="font-display text-3xl font-extrabold tabular-nums text-ink">
                      {persen(BOBOT[f.kunci])}
                    </span>
                  </span>
                  <span className="mt-3 block text-sm italic text-ink-soft">“{f.tanya}”</span>
                  <span
                    className={`grid transition-all duration-300 ${ini ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 group-hover:mt-3 group-hover:grid-rows-[1fr] group-hover:opacity-100'}`}
                  >
                    <span className="overflow-hidden">
                      <span className="block rounded-lg bg-paper px-3 py-2 font-mono text-xs leading-relaxed text-ink">
                        {f.cara}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* skala level */}
      <div className="mt-10">
        <p className="text-sm font-bold text-ink">Dari skor ke tindakan</p>
        <div className="relative mt-3">
          <div className="flex h-3 overflow-hidden rounded-full">
            <div className="bg-brand-200" style={{ width: `${AMBANG.sedang}%` }} />
            <div className="bg-brand-500" style={{ width: `${AMBANG.tinggi - AMBANG.sedang}%` }} />
            <div className="flex-1 bg-brand-900" />
          </div>
          <div className="mt-1 flex justify-between font-mono text-xs text-ink-faint">
            <span>0</span>
            <span>100</span>
          </div>
          {[AMBANG.sedang, AMBANG.tinggi].map((a) => (
            <span
              key={a}
              className="absolute top-0 -translate-x-1/2 text-center font-mono text-xs font-bold text-ink"
              style={{ left: `${a}%` }}
            >
              <span className="mx-auto block h-3 w-0.5 bg-brand-900" />
              {a}
            </span>
          ))}
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Rendah', `< ${AMBANG.sedang}`, 'Dipantau'],
            ['Sedang', `${AMBANG.sedang}–${AMBANG.tinggi - 1}`, 'Dijadwalkan'],
            ['Tinggi', `≥ ${AMBANG.tinggi}`, 'Ditangani lebih dulu'],
          ].map(([level, rentang, arti]) => {
            const w = warnaLevel(level)
            return (
              <li
                key={level}
                className={`rounded-xl border p-4 transition-transform duration-300 hover:-translate-y-1 ${w.latar} ${w.garis}`}
              >
                <p className={`text-sm font-bold ${w.teks}`}>Prioritas {level}</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-ink">{rentang}</p>
                <p className="text-sm text-ink-soft">{arti}</p>
              </li>
            )
          })}
        </ul>
      </div>

      <details className="group mt-6 rounded-xl border border-line bg-white open:shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink hover:text-brand-700">
          Kenapa bobotnya begini?
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <p className="px-4 pb-4 text-sm">
          Risiko dan riwayat bencana paling objektif, jadi bobotnya terbesar. Kemiskinan memastikan wilayah yang paling
          sulit pulih tidak tertinggal. Laporan serupa memberi suara pada warga, tanpa membuat yang paling ramai
          otomatis menang.
        </p>
      </details>
    </>
  )
}

// ── 02 Kalkulator ──
function Kalkulator() {
  const [wilayahId, setWilayahId] = useState(WILAYAH[0].id)
  const [kategoriId, setKategoriId] = useState(KATEGORI[0].id)
  const [serupa, setSerupa] = useState(0)
  const wilayah = WILAYAH.find((w) => w.id === wilayahId)
  const p = hitungPrioritas(wilayah, kategoriId, serupa)
  const w = warnaLevel(p.level)
  const kelasInput =
    'mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors hover:border-brand-300 focus:border-brand-500'

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4 border-b border-line p-5 md:border-b-0 md:border-r">
        <label className="block text-sm font-semibold text-ink">
          Wilayah
          <select value={wilayahId} onChange={(e) => setWilayahId(e.target.value)} className={kelasInput}>
            {WILAYAH.map((x) => (
              <option key={x.id} value={x.id}>
                {x.ilustrasi ? x.kecamatan : `Kec. ${x.kecamatan}, ${x.kabupaten}`}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Jenis masalah</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {KATEGORI.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKategoriId(k.id)}
                aria-pressed={kategoriId === k.id}
                className={`min-h-9 rounded-full border px-3 text-sm transition-colors ${
                  kategoriId === k.id
                    ? 'border-brand-600 bg-brand-600 font-bold text-white'
                    : 'border-line bg-white text-ink-soft hover:border-brand-400 hover:text-ink'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold text-ink">
          Warga lain yang melapor hal serupa: <span className="font-mono tabular-nums">{serupa}</span>
          <input
            type="range"
            min={0}
            max={NORMALISASI.serupaMaks + 2}
            value={serupa}
            onChange={(e) => setSerupa(Number(e.target.value))}
            className="mt-2 w-full cursor-pointer accent-brand-600"
          />
        </label>
      </div>
      <div className="p-5">
        <div className={`flex items-center gap-4 rounded-xl border p-4 ${w.latar} ${w.garis}`}>
          <span className={`font-display text-5xl font-extrabold tabular-nums ${w.teks}`}>{p.skor}</span>
          <div className="min-w-0">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${w.lencana}`}>
              Prioritas {p.level}
            </span>
            <p className="mt-1.5 text-sm text-ink">{p.penjelasan}</p>
          </div>
        </div>
        <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-wide text-ink-faint">Nilai faktor × bobot</p>
        <RincianFaktor faktor={p.faktor} />
      </div>
    </div>
  )
}

// ── 03 Verifikasi: langkah bernomor, langkah yang disorot terbuka ──
function LangkahVerifikasi() {
  const [buka, setBuka] = useState(0)
  const LANGKAH = [
    {
      judul: 'Instansi klaim selesai',
      isi: 'Instansi menandai “klaim selesai”. Statusnya belum sah: instansi tidak bisa menandai laporannya sendiri sebagai terverifikasi.',
    },
    {
      judul: 'Warga kirim bukti',
      isi: `Warga sekitar mengirim foto yang diambil setelah tanggal klaim, dalam radius ${ATURAN_VERIFIKASI.radiusMeter} m. Pelapor sendiri tidak bisa ikut, dan satu perangkat hanya sekali.`,
    },
    {
      judul: 'Mayoritas menentukan',
      isi: `Terverifikasi bila minimal ${ATURAN_VERIFIKASI.target} warga menyatakan beres dan jumlahnya lebih banyak dari yang menyatakan belum.`,
    },
    {
      judul: 'Atau dibuka ulang',
      isi: `Mayoritas menyatakan belum beres, atau ${ATURAN_VERIFIKASI.batasHari} hari tanpa cukup bukti? Laporan otomatis kembali ke antrean instansi.`,
    },
  ]
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {LANGKAH.map((l, i) => {
        const ini = buka === i
        return (
          <li key={l.judul} className="relative">
            {i < LANGKAH.length - 1 && (
              <span
                className="absolute left-[2.1rem] top-9 hidden h-0.5 w-[calc(100%-1rem)] bg-brand-100 md:block"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onMouseEnter={() => setBuka(i)}
              onFocus={() => setBuka(i)}
              onClick={() => setBuka(i)}
              aria-expanded={ini}
              className={`relative h-full w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                ini
                  ? 'border-brand-500 bg-brand-50 shadow-[0_18px_40px_-26px_rgba(6,149,80,0.8)]'
                  : 'border-line bg-white hover:border-brand-300'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-extrabold transition-colors ${
                  ini ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
                }`}
              >
                {i + 1}
              </span>
              <span className="mt-3 block font-bold text-ink">{l.judul}</span>
              <span
                className={`grid text-sm transition-all duration-300 ${ini ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:grid-rows-[0fr]'}`}
              >
                <span className="overflow-hidden">{l.isi}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ── 04 Kesenjangan ──
function Kesenjangan() {
  const b = ATURAN_ANALITIK.bobotKesenjangan
  const SUKU = [
    {
      bobot: b.risiko,
      label: 'risiko tertinggi',
      ket: 'Risiko banjir/longsor/jalan tertinggi di wilayah itu (0–100).',
    },
    {
      bobot: b.menumpuk,
      label: 'laporan menumpuk',
      ket: `Jumlah laporan terbuka ÷ ${ATURAN_ANALITIK.menumpukMaks} (maks. 100).`,
    },
    {
      bobot: b.lambat,
      label: 'penanganan lambat',
      ket: `Umur rata-rata laporan terbuka ÷ ${ATURAN_ANALITIK.lambatMaksHari} hari (maks. 100).`,
    },
  ]
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <p>
          <strong className="text-ink">Skor kesenjangan</strong> (0–100) mengukur jarak antara seberapa rawan sebuah
          wilayah dan seberapa baik laporannya ditangani. Dipakai di peta dan daftar Perlu Perhatian di{' '}
          <Link to="/dasbor" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900">
            Dasbor
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-sm">
          <span className="font-bold text-ink">Kesenjangan =</span>
          {SUKU.map((s, i) => (
            <span key={s.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-ink-faint">+</span>}
              <span className="group relative">
                <span className="inline-flex cursor-help items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 transition-colors hover:border-brand-400 hover:bg-brand-50">
                  <b className="text-brand-700">{persen(s.bobot)}</b> × {s.label}
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-56 rounded-lg bg-brand-900 px-3 py-2 font-sans text-xs leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                >
                  {s.ket}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-brand-900 p-6 text-white">
        <p className="font-display text-xl font-extrabold">Wilayah Senyap</p>
        <p className="mt-2 text-sm text-white/80">
          Risiko ≥ {ATURAN_ANALITIK.risikoTinggi}, tapi laporannya dalam {ATURAN_ANALITIK.jendelaHari} hari terakhir
          kurang dari {persen(ATURAN_ANALITIK.senyapRasio)} rata-rata wilayah lain.
        </p>
        <p className="mt-4 border-l-2 border-brand-300 pl-3 text-sm text-white/90">
          Bisa jadi warganya tidak tahu cara melapor, tidak punya akses, atau sudah tidak percaya. Karena itu ditandai,
          bukan diabaikan.
        </p>
      </div>
    </div>
  )
}

// ── 05 Peran AI: boleh vs tidak boleh ──
function PeranAi() {
  const BOLEH = [
    `Menyarankan kategori dari foto (bila yakin ≥ ${persen(AMBANG_SARAN)}) dan memeriksa foto verifikasi`,
    'Merapikan judul & deskripsi laporan tanpa menambah fakta',
    'Menulis ringkasan beranda, dasbor, wilayah, penjelasan skor, dan tips keselamatan',
    'Membantu petugas: briefing, saran tindakan, catatan supervisi, narasi rekap, tanya-data',
  ]
  const TIDAK = [
    'Mengubah skor prioritas (hanya rumus di atas)',
    'Mengubah status laporan (hanya instansi & konfirmasi warga)',
    'Menulis angka yang tidak ada di fakta (otomatis ditolak)',
    'Menerima data pribadi warga atau menyimpan foto',
  ]
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
          <p className="font-bold text-brand-800">AI boleh</p>
          <ul className="mt-3 space-y-2.5 text-sm text-ink">
            {BOLEH.map((t) => (
              <li key={t} className="flex gap-2.5 rounded-lg p-1 transition-colors hover:bg-white">
                <Check size={16} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-white p-5">
          <p className="font-bold text-brand-900">AI tidak boleh</p>
          <ul className="mt-3 space-y-2.5 text-sm text-ink">
            {TIDAK.map((t) => (
              <li key={t} className="flex gap-2.5 rounded-lg p-1 transition-colors hover:bg-brand-50">
                <X size={16} className="mt-0.5 shrink-0 text-brand-900" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-sm">
        Semua model berjalan lewat server CivicPulse; HP warga tidak mengunduh apa pun. Foto dianalisis di memori server
        lalu dibuang. Model bahasa (Groq) hanya menerima angka, kategori, dan nama wilayah, kecuali teks yang kamu ketik
        sendiri saat menekan “Rapikan dengan AI” atau bertanya, jadi jangan menulis nama orang atau nomor identitas.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {sumberAI.map((m) => (
          <li
            key={m.hfId ?? m.modelId}
            className="rounded-xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm"
          >
            <p className="truncate font-mono text-xs font-bold text-ink" title={m.hfId ?? m.modelId}>
              {m.hfId ?? m.modelId}
            </p>
            <p className="mt-1 text-sm">{m.tugas.join(', ')}</p>
            <p className="mt-2 text-xs text-ink-faint">
              {m.evaluasi ? 'Sudah dievaluasi' : `${m.status} · belum dievaluasi`}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}

// ── 06 Sumber data & batasan ──
function SumberData() {
  const BATASAN = [
    'IRBI, DIBI, dan kemiskinan BPS tersedia per kab/kota. Kecamatan dalam satu kab/kota memakai nilai yang sama.',
    'Risiko banjir/longsor = % penduduk kab/kota di zona risiko sedang–tinggi (BNPB, Buku RBI 2023), relatif terhadap kab/kota pilot dengan paparan tertinggi (= 100).',
    'IRBI tidak punya bahaya “kerusakan jalan”. Risiko jalan memakai proksi: rata-rata risiko banjir dan longsor.',
    SUMBER_DATA.dibi.url
      ? 'Data DIBI publik tidak mencakup kejadian terbaru; periodenya tertulis di kartu sumber.'
      : 'Riwayat DIBI belum dimuat. Sementara bobotnya dibagi proporsional ke faktor lain.',
    'Kecamatan ditentukan dari titik pusat terdekat, belum dari batas wilayah resmi.',
    ...(DATA_ILUSTRASI ? ['Nilai wilayah di luar pilot masih data ilustrasi dan sedang diganti data resmi.'] : []),
  ]
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Object.values(SUMBER_DATA).map((s) => {
          const isi = (
            <>
              <span className="flex items-start justify-between gap-2">
                <span className="font-bold text-ink">{s.nama}</span>
                {s.url && (
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="mt-1 block text-sm">{s.instansi}</span>
              <span className="mt-3 inline-block rounded-full bg-paper px-2.5 py-0.5 font-mono text-xs text-ink">
                {s.tahun ?? s.periode ?? 'menunggu impor'}
              </span>
            </>
          )
          return (
            <li key={s.nama}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block h-full rounded-xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                >
                  {isi}
                </a>
              ) : (
                <div className="h-full rounded-xl border border-dashed border-line bg-white p-4">{isi}</div>
              )}
            </li>
          )
        })}
      </ul>
      <details className="group mt-5 rounded-xl border border-brand-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-brand-900 hover:text-brand-700">
          {BATASAN.length} batasan yang perlu diketahui
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ol className="space-y-2 px-4 pb-4 text-sm text-ink">
          {BATASAN.map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="font-mono text-xs font-bold text-brand-600">{String(i + 1).padStart(2, '0')}</span>
              {t}
            </li>
          ))}
        </ol>
      </details>
    </>
  )
}
