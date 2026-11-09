import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Muncul, { AngkaBerjalan } from '../components/Muncul.jsx'
import PetaIndonesia from '../components/PetaIndonesia.jsx'
import KartuAi from '../components/KartuAi.jsx'
import PesonaNusantara from '../components/PesonaNusantara.jsx'
import Latar3D from '../components/Latar3D.jsx'
import { KreditFoto, MotifKawung } from '../components/SampulHalaman.jsx'
import { pilihFoto } from '../lib/pesona.js'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  Map as IkonPeta,
  Search,
  Camera,
  Database,
  Eye,
  Gauge,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Users,
  CloudRain,
  History,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { LABEL_STATUS, POLA_KODE, STATUS, ringkasVerifikasi } from '@civicpulse/core'
import { DATA_ILUSTRASI, SUMBER_DATA } from '../lib/peta.js'
import { useApi } from '../hooks/useApi.js'
import { api } from '../services/api.js'

const LANGKAH = [
  {
    ikon: Camera,
    judul: 'Warga melapor',
    isi: 'Foto, titik lokasi, dan deskripsi singkat. Selesai dalam kurang dari satu menit.',
  },
  {
    ikon: Database,
    judul: 'Diperkaya data publik',
    isi: 'Lokasi dicocokkan dengan risiko bencana, riwayat kejadian, dan tingkat kemiskinan wilayah.',
  },
  {
    ikon: Gauge,
    judul: 'Diberi skor prioritas',
    isi: 'Skor 0–100 beserta kalimat alasannya. Rumusnya terbuka, bisa diperiksa siapa saja.',
  },
  {
    ikon: Users,
    judul: 'Diverifikasi warga',
    isi: 'Status selesai baru sah setelah warga sekitar mengirim foto berlokasi sebagai bukti.',
  },
]

// Periode/tahun dibaca dari data/processed/wilayah.json, bukan diketik di sini,
// agar halaman tidak pernah mengklaim periode data yang belum benar-benar diimpor.
const periode = (s) => s?.tahun ?? s?.periode
const SUMBER = [
  {
    ikon: CloudRain,
    nama: 'IRBI',
    lembaga: 'BNPB',
    isi: 'Indeks Risiko Bencana Indonesia per kabupaten/kota: seberapa rawan wilayah terhadap banjir dan longsor.',
    periode: periode(SUMBER_DATA.irbi),
  },
  {
    ikon: History,
    nama: 'DIBI',
    lembaga: 'BNPB',
    isi: 'Data dan Informasi Bencana Indonesia: berapa kali bencana benar-benar terjadi di wilayah itu.',
    periode: periode(SUMBER_DATA.dibi),
  },
  {
    ikon: Wallet,
    nama: 'Kemiskinan',
    lembaga: 'BPS',
    isi: 'Persentase penduduk miskin kabupaten/kota: siapa yang paling sulit pulih saat terdampak.',
    periode: periode(SUMBER_DATA.bps),
  },
]

const AI = [
  {
    ikon: Eye,
    judul: 'Membaca foto',
    isi: 'Computer vision (CLIP) menebak kategori masalah dari fotomu, dan memeriksa foto bukti saat verifikasi.',
    ke: '/lapor',
    aksi: 'Coba unggah foto',
  },
  {
    ikon: MessageSquare,
    judul: 'Merangkum dasbor',
    isi: 'Model bahasa di server CivicPulse menulis ringkasan dasbor hanya dari angka laporan. Angka yang tidak ada di data otomatis ditolak.',
    ke: '/dasbor',
    aksi: 'Lihat ringkasan',
  },
  {
    ikon: Lock,
    judul: 'Ringan & privat',
    isi: 'AI berjalan di server CivicPulse, jadi HP-mu tidak perlu mengunduh apa pun. Foto hanya dianalisis lalu dibuang, tidak dikirim ke layanan AI pihak ketiga.',
  },
]

const KODE_CONTOH = 'CP-2026-0417'

// Latar hero: foto Nusantara realistis (acak) di bawah gradasi hijau, motif kawung, medan titik Three.js (desktop),
// lalu peta Indonesia di tengah.
function HeroLatar({ foto }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <img
        src={`/pesona/${foto}.webp`}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover motion-safe:animate-sampul"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-brand-800/80 to-brand-700/70" />
      <MotifKawung className="opacity-[0.05]" />
      <div className="absolute -left-20 top-10 h-72 w-72 animate-gumpal rounded-full bg-brand-400/30 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-80 w-80 animate-gumpal rounded-full bg-aksen-400/20 blur-3xl [animation-delay:-5s]" />
      <Latar3D />
      {/* Peta Indonesia di tengah; vinyet radial menggelapkan bagian belakang teks agar tetap terbaca. */}
      <PetaIndonesia className="absolute left-1/2 top-[46%] w-[175%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-45 sm:w-[130%] md:w-[110%] md:opacity-70 lg:w-[96%] lg:max-w-[1500px] lg:opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,61,36,0.82)_0%,rgba(10,61,36,0.55)_38%,rgba(10,61,36,0.1)_72%)]" />
    </div>
  )
}

// Ilustrasi masalah: urutan berdasarkan jumlah dukungan vs berdasarkan skor konteks.
const ANTREAN = [
  { judul: 'Trotoar retak di pusat kota', wilayah: 'Coblong', dukungan: 48, skor: 31 },
  { judul: 'Lampu taman mati', wilayah: 'Sukajadi', dukungan: 35, skor: 27 },
  { judul: 'Drainase tersumbat dekat sungai', wilayah: 'Dayeuhkolot', dukungan: 3, skor: 73 },
]

// Kotak lacak di hero (pola portal pemerintahan: "apa yang ingin Anda cari?").
function CariLacak() {
  const navigate = useNavigate()
  const [kode, setKode] = useState('')
  const [galat, setGalat] = useState('')
  const kirim = (e) => {
    e.preventDefault()
    const k = kode.trim().toUpperCase()
    if (!k) return navigate('/lacak')
    if (!POLA_KODE.test(k)) return setGalat('Format kode: CP-TAHUN-NOMOR, misalnya CP-2026-0417.')
    navigate(`/laporan/${k}`)
  }
  return (
    <form onSubmit={kirim} role="search" className="mt-7 w-full max-w-xl text-left" aria-label="Lacak laporan">
      <label htmlFor="cari-lacak" className="sr-only">
        Kode lacak laporan
      </label>
      <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
        <Search size={20} className="ml-2 shrink-0 text-brand-600" aria-hidden="true" />
        <input
          id="cari-lacak"
          value={kode}
          onChange={(e) => {
            setKode(e.target.value)
            setGalat('')
          }}
          placeholder="Lacak laporan, mis. CP-2026-0417"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
        />
        <button type="submit" className="btn-primary min-h-11 shrink-0 px-4">
          Lacak
        </button>
      </div>
      {galat && (
        <p role="alert" className="mt-2 text-sm font-semibold text-aksen-300">
          {galat}
        </p>
      )}
    </form>
  )
}

const LAYANAN = [
  { ke: '/lapor', ikon: Camera, judul: 'Lapor Masalah', isi: 'Foto + lokasi, kurang dari semenit', utama: true },
  { ke: '/lacak', ikon: Search, judul: 'Lacak Laporan', isi: 'Pantau sampai terbukti beres' },
  { ke: '/peta', ikon: IkonPeta, judul: 'Peta Laporan', isi: 'Sebaran masalah di sekitarmu' },
  { ke: '/dasbor', ikon: BarChart3, judul: 'Dasbor Akuntabilitas', isi: 'Kinerja penanganan terbuka' },
  { ke: '/metodologi', ikon: BookOpenCheck, judul: 'Metodologi Skor', isi: 'Rumus prioritas yang bisa diperiksa' },
  { ke: '/instansi/masuk', ikon: Building2, judul: 'Masuk Instansi', isi: 'Panel kab/kota, provinsi, pusat' },
]

function LayananCepat() {
  return (
    <section className="container-page relative z-10 -mt-14 sm:-mt-16" aria-label="Layanan">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {LAYANAN.map((l, i) => (
          <li key={l.ke} className="animate-muncul" style={{ animationDelay: `${150 + i * 70}ms` }}>
            <Link
              to={l.ke}
              className={`kartu-angkat group flex h-full flex-col rounded-2xl border p-4 shadow-[0_10px_30px_-18px_rgba(10,61,36,0.5)] ${
                l.utama ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white'
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                  l.utama ? 'bg-aksen-400 text-brand-900' : 'bg-brand-50 text-brand-600'
                }`}
              >
                <l.ikon size={21} aria-hidden="true" />
              </span>
              <span className="mt-3 font-display text-[15px] font-bold leading-tight">{l.judul}</span>
              <span className={`mt-1 text-xs leading-snug ${l.utama ? 'text-brand-100' : 'text-ink-soft'}`}>
                {l.isi}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Landing() {
  const [fotoHero] = useState(() => pilihFoto('beranda'))
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        <HeroLatar foto={fotoHero} />
        <KreditFoto id={fotoHero} className="absolute right-4 top-3 z-10 hidden sm:inline-flex" />
        <div className="container-page relative flex flex-col items-center pb-24 pt-10 text-center md:pb-28 md:pt-16 lg:min-h-[580px] lg:justify-center">
          <div className="flex animate-muncul flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-brand-100 backdrop-blur-sm">
              <ShieldCheck size={15} aria-hidden="true" /> Layanan laporan warga · dari Sabang sampai Merauke
            </div>
            <h1 className="mt-5 max-w-3xl text-[2.55rem] font-extrabold leading-[1.05] tracking-[-0.02em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-[4.25rem]">
              Laporanmu tidak berhenti di kotak masuk.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
              Masalah di sekitarmu dicatat, diprioritaskan dengan alasan yang terbuka, lalu status selesainya diperiksa
              warga. Tanpa perlu membuat akun.
            </p>
            <CariLacak />
            <div className="mt-5 flex w-full flex-col justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row">
              <Link to="/lapor" className="btn min-h-12 bg-aksen-400 px-6 text-base text-brand-900 hover:bg-aksen-300">
                <Camera size={18} /> Lapor Sekarang <ArrowRight size={18} />
              </Link>
              <Link
                to="/peta"
                className="btn min-h-12 border border-white/30 bg-transparent px-5 text-white hover:border-white hover:bg-white/10"
              >
                <MapPin size={17} /> Lihat peta
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-sm font-medium text-white/80">
              <span className="inline-flex items-center gap-2">
                <Users size={16} className="text-brand-100" /> Tanpa akun
              </span>
              <span className="inline-flex items-center gap-2">
                <Lock size={15} className="text-brand-100" /> Tanpa unduhan aplikasi
              </span>
            </div>
          </div>
        </div>
      </section>

      <LayananCepat />
      <AngkaLangsung />
      <PesonaNusantara />

      {/* MASALAH */}
      <section className="border-y border-line bg-white py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Masalahnya</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Yang paling ramai belum tentu yang paling berisiko.
            </h2>
            <p className="mt-4 text-ink-soft">
              Laporan masuk ke instansi tanpa konteks, sehingga semuanya terlihat sama penting. Yang diproses duluan
              sering yang paling vokal. Wilayah rawan dan miskin, yang warganya jarang melapor, justru tertinggal.
            </p>
            <p className="mt-3 text-ink-soft">
              Karena itu CivicPulse juga menandai <strong className="text-ink">Wilayah Senyap</strong>: wilayah berisiko
              tinggi yang laporannya tiba-tiba sepi. Sepi belum tentu aman.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper p-6">
              <p className="text-sm font-bold text-ink-soft">Antrean biasa · diurutkan dukungan</p>
              <ol className="mt-4 space-y-3">
                {[...ANTREAN]
                  .sort((a, b) => b.dukungan - a.dukungan)
                  .map((a, i) => (
                    <li key={a.judul} className="flex items-center gap-3 rounded-xl bg-white p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-sm font-bold text-ink-soft">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.judul}</p>
                        <p className="text-xs text-ink-faint">Kec. {a.wilayah}</p>
                      </div>
                      <span className="text-xs font-semibold text-ink-soft">{a.dukungan} dukungan</span>
                    </li>
                  ))}
              </ol>
            </div>
            <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-6">
              <p className="text-sm font-bold text-brand-700">CivicPulse · diurutkan skor konteks</p>
              <ol className="mt-4 space-y-3">
                {[...ANTREAN]
                  .sort((a, b) => b.skor - a.skor)
                  .map((a, i) => (
                    <li key={a.judul} className="flex items-center gap-3 rounded-xl bg-white p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.judul}</p>
                        <p className="text-xs text-ink-faint">Kec. {a.wilayah}</p>
                      </div>
                      <span className={`text-xs font-bold ${a.skor >= 70 ? 'text-tinggi' : 'text-rendah'}`}>
                        skor {a.skor}
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-faint">Ilustrasi urutan penanganan, bukan data riil.</p>
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="container-page scroll-mt-20 py-20">
        <p className="eyebrow">Cara kerja</p>
        <h2 className="mt-3 max-w-2xl break-words text-2xl font-extrabold tracking-tight sm:text-4xl">
          Dari satu foto menjadi keputusan yang bisa dipertanggungjawabkan.
        </h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LANGKAH.map((l, i) => (
            <Muncul as="li" jeda={i * 120} key={l.judul} className="card kartu-angkat p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <l.ikon size={22} />
                </span>
                <span className="text-sm font-bold text-ink-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-bold">{l.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{l.isi}</p>
            </Muncul>
          ))}
        </ol>
      </section>

      {/* AI */}
      <section className="border-y border-line bg-white py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">AI yang membantu, bukan memutuskan</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              AI membantu, keputusan tetap pada rumus dan warga.
            </h2>
            <p className="mt-4 text-ink-soft">
              AI hanya memberi saran. Skor ditentukan rumus terbuka, dan klaim selesai tetap menunggu konfirmasi warga.
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {AI.map((a, i) => (
              <Muncul
                as="li"
                jeda={i * 120}
                key={a.judul}
                className="kartu-angkat flex flex-col rounded-2xl border border-line bg-paper p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <a.ikon size={22} />
                </span>
                <h3 className="mt-5 font-bold">{a.judul}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{a.isi}</p>
                {a.ke && (
                  <Link
                    to={a.ke}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
                  >
                    {a.aksi} <ArrowRight size={14} />
                  </Link>
                )}
              </Muncul>
            ))}
          </ul>
        </div>
      </section>

      {/* DATA PUBLIK */}
      <section className="container-page py-20">
        <div className="grid gap-10 rounded-3xl bg-ink p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-100">Data publik resmi</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Konteks dari sumber resmi, bukan tebakan.</h2>
            <p className="mt-4 text-white/70">
              Setiap faktor skor menyebut sumber datanya.
              {DATA_ILUSTRASI &&
                ' Pada prototipe ini nilai wilayah masih data ilustrasi dan sedang diganti dengan hasil impor dataset resmi.'}
            </p>
            <Link
              to="/metodologi"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-100 hover:text-white"
            >
              Lihat rumus skor <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {SUMBER.map((s) => (
              <li key={s.nama} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <s.ikon size={22} className="text-brand-100" />
                <p className="mt-4 font-bold">
                  {s.nama} <span className="font-medium text-white/60">· {s.lembaga}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.isi}</p>
                <p className="mt-3 text-xs font-semibold text-brand-100/80">
                  {s.periode ? `Periode: ${s.periode}` : 'Periode: menunggu impor data resmi'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AKUNTABILITAS */}
      <section className="container-page grid grid-cols-1 items-center gap-12 pb-8 md:grid-cols-2">
        <div>
          <p className="eyebrow">Akuntabilitas</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            “Sudah ditangani” harus dibuktikan, bukan cuma diklaim.
          </h2>
          <p className="mt-4 text-ink-soft">
            Saat instansi menandai laporan selesai, warga di sekitar lokasi diminta mengirim foto berlokasi. Laporan
            baru berstatus terverifikasi jika mayoritas dari minimal tiga warga mengonfirmasi. Jika tidak, laporan
            dibuka ulang.
          </p>
          <Link to={`/laporan/${KODE_CONTOH}`} className="btn-ghost mt-6">
            Lihat contoh pelacakan <ArrowRight size={16} />
          </Link>
        </div>
        <LinimasaContoh />
      </section>

      {/* CTA */}
      <section className="container-page pt-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-600 p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Lihat masalah di sekitarmu?</h2>
            <p className="mt-2 text-brand-100">Satu laporan berkonteks bisa menggeser prioritas penanganan.</p>
          </div>
          <Link to="/lapor" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Lapor Sekarang <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}

const formatTanggal = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

// Angka transparansi langsung dari sistem (bukan diketik), sama dengan yang dipakai Dasbor.
function AngkaLangsung() {
  const { data: stat, loading, error } = useApi(() => api.statistik(), [])
  if (error)
    return (
      <section className="container-page pb-16" aria-label="Angka langsung dari sistem">
        <div className="card flex items-start gap-3 p-5 text-sm text-ink-soft" role="alert">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-sedang" />
          {error.message}
        </div>
      </section>
    )
  const angka = stat && [
    { nilai: stat.total, label: 'laporan masuk' },
    { nilai: `${stat.persenTerverifikasi}%`, label: 'klaim selesai yang terbukti oleh warga' },
    { nilai: stat.medianHariTangani?.toLocaleString('id-ID') ?? '–', label: 'hari median sampai terverifikasi' },
    { nilai: stat.wilayahSenyap.length, label: 'wilayah senyap perlu dicek', ke: '/dasbor' },
  ]
  if (!loading && !stat)
    return (
      <section className="container-page pb-16" aria-label="Angka langsung dari sistem">
        <div className="card p-5 text-sm text-ink-soft">Belum ada ringkasan laporan untuk ditampilkan.</div>
      </section>
    )
  return (
    <section className="container-page relative pb-10 pt-8 sm:pb-14 sm:pt-10" aria-label="Angka langsung dari sistem">
      <div className="card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">Angka langsung dari sistem</p>
          {api.mode === 'lokal' && <span className="tag-ilustrasi">Data demo</span>}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <li key={i} className="h-24 animate-pulse rounded-xl bg-paper" />)
            : angka.map((a) => {
                const isi = (
                  <>
                    <p className="font-display text-3xl font-extrabold tabular-nums text-brand-800">
                      <AngkaBerjalan nilai={a.nilai} />
                    </p>
                    <p className="mt-1 text-sm leading-snug text-ink-soft">{a.label}</p>
                  </>
                )
                return (
                  <li key={a.label}>
                    {a.ke ? (
                      <Link
                        to={a.ke}
                        className="block h-full min-h-24 rounded-xl border border-line bg-paper p-3 transition-colors hover:border-brand-100 hover:bg-brand-50"
                      >
                        {isi}
                      </Link>
                    ) : (
                      <div className="h-full min-h-24 rounded-xl border border-line bg-paper p-3">{isi}</div>
                    )}
                  </li>
                )
              })}
        </ul>
        <KartuAi
          tugas="beranda"
          otomatis
          polos
          judul="Kondisi laporan hari ini"
          sub="Dirangkum AI dari angka di atas. Angka yang tidak ada di data otomatis ditolak."
          className="mt-5 border-t border-line pt-5"
        />
      </div>
    </section>
  )
}

// Linimasa memakai laporan contoh yang sungguhan ada di sistem, jadi "Lihat contoh pelacakan" konsisten.
function LinimasaContoh() {
  const { data: laporan, loading, error } = useApi(() => api.getLaporan(KODE_CONTOH), [])
  if (loading) return <div className="card h-72 animate-pulse" />
  if (error)
    return (
      <div className="card flex items-start gap-3 p-5 text-sm text-ink-soft" role="alert">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-sedang" />
        {error.message}
      </div>
    )
  if (!laporan) return <div className="card p-5 text-sm text-ink-soft">Belum ada laporan contoh untuk ditampilkan.</div>
  const ver = ringkasVerifikasi(laporan)
  const menunggu = laporan.status === STATUS.KLAIM_SELESAI
  return (
    <ol className="card space-y-5 p-6">
      {laporan.riwayat.map((e, i) => (
        <li key={`${e.status}-${i}`} className="flex gap-4">
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <ShieldCheck size={14} />
          </span>
          <div className="flex-1">
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{LABEL_STATUS[e.status]}</p>
              <p className="text-sm tabular-nums text-ink-faint">{formatTanggal(e.waktu)}</p>
            </div>
            {e.catatan && <p className="text-sm text-ink-soft">{e.catatan}</p>}
          </div>
        </li>
      ))}
      {menunggu && (
        <li className="flex gap-4">
          <span className="mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-brand-500" />
          <div className="flex-1">
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{LABEL_STATUS[STATUS.TERVERIFIKASI]}</p>
              <p className="text-sm tabular-nums text-brand-700">
                {ver.beres} / {ver.target}
              </p>
            </div>
            <p className="text-sm text-ink-soft">
              Menunggu {Math.max(ver.target - ver.beres, 0)} konfirmasi foto lagi dari warga sekitar
            </p>
          </div>
        </li>
      )}
    </ol>
  )
}
