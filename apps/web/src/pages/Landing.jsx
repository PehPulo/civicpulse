import { Link } from 'react-router-dom'
import {
  ArrowRight,
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
import { LABEL_STATUS, STATUS, hitungPrioritas, kategoriById, ringkasVerifikasi } from '@civicpulse/core'
import { DATA_ILUSTRASI, SUMBER_DATA, wilayahById } from '../lib/peta.js'
import { LencanaPrioritas, warnaLevel } from '../components/Prioritas.jsx'
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
    judul: 'Berjalan di perangkatmu',
    isi: 'Model pengenal foto berjalan langsung di browser: gratis, tanpa kunci API, dan fotomu tidak dikirim ke layanan AI pihak ketiga.',
  },
]

const KODE_CONTOH = 'CP-2026-0417'

// Ilustrasi masalah: urutan berdasarkan jumlah dukungan vs berdasarkan skor konteks.
const ANTREAN = [
  { judul: 'Trotoar retak di pusat kota', wilayah: 'Coblong', dukungan: 48, skor: 31 },
  { judul: 'Lampu taman mati', wilayah: 'Sukajadi', dukungan: 35, skor: 27 },
  { judul: 'Drainase tersumbat dekat sungai', wilayah: 'Dayeuhkolot', dukungan: 3, skor: 73 },
]

// Kartu ilustrasi di hero: dihitung langsung dengan rumus yang sama seperti laporan sungguhan.
const CONTOH = {
  kode: KODE_CONTOH,
  judul: 'Saluran air tersumbat sampah di depan pasar',
  kategoriId: 'drainase',
  wilayah: wilayahById('dayeuhkolot'),
  prioritas: hitungPrioritas(wilayahById('dayeuhkolot'), 'drainase', 4),
}

export default function Landing() {
  const contoh = CONTOH

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        <div
          className="pointer-events-none absolute -right-24 -top-36 h-[34rem] w-[34rem] rounded-full border-[64px] border-white/[0.035]"
          aria-hidden="true"
        />
        <div className="container-page relative grid grid-cols-1 items-center gap-8 py-9 md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-brand-100">
              <ShieldCheck size={15} aria-hidden="true" /> Layanan laporan warga · Bandung Raya
            </div>
            <h1 className="mt-5 max-w-2xl text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4rem]">
              Laporanmu tidak berhenti di kotak masuk.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Masalah di sekitarmu dicatat, diprioritaskan dengan alasan yang terbuka, lalu status selesainya diperiksa
              warga. Tanpa perlu membuat akun.
            </p>
            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
              <Link to="/lapor" className="btn min-h-12 bg-white px-6 text-base text-brand-900 hover:bg-brand-50">
                <Camera size={18} /> Lapor Sekarang <ArrowRight size={18} />
              </Link>
              <Link
                to="/peta"
                className="btn min-h-12 border border-white/30 bg-transparent px-5 text-white hover:border-white hover:bg-white/10"
              >
                <MapPin size={17} /> Lihat peta
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-sm font-medium text-white/80">
              <span className="inline-flex items-center gap-2">
                <Users size={16} className="text-brand-100" /> Tanpa akun
              </span>
              <span className="inline-flex items-center gap-2">
                <Lock size={15} className="text-brand-100" /> AI foto berjalan di perangkat
              </span>
            </div>
          </div>

          {/* Kartu contoh laporan berkonteks */}
          <div className="relative">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-white/10" aria-hidden="true" />
            <article className="card overflow-hidden border-t-4 border-t-brand-600 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                  Contoh laporan berkonteks
                </span>
                <span className="tag-ilustrasi">Data ilustrasi</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-brand-700">KODE {contoh.kode}</p>
              <h2 className="mt-3 text-lg font-bold leading-snug">{contoh.judul}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
                <MapPin size={14} /> Kec. {contoh.wilayah.kecamatan}, {contoh.wilayah.kabupaten} ·{' '}
                {kategoriById(contoh.kategoriId).label}
              </p>

              <div className="mt-5 flex items-end gap-4">
                <span
                  className={`text-6xl font-extrabold leading-none tabular-nums ${warnaLevel(contoh.prioritas.level).teks}`}
                >
                  {contoh.prioritas.skor}
                </span>
                <div className="pb-1">
                  <LencanaPrioritas level={contoh.prioritas.level} skor={contoh.prioritas.skor} />
                  <p className="mt-1 text-xs text-ink-faint">skor prioritas dari 100</p>
                </div>
              </div>

              <p className="mt-5 rounded-xl bg-paper p-4 text-sm leading-relaxed text-ink">
                “{contoh.prioritas.penjelasan}”
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                {contoh.prioritas.faktor.map((f) => (
                  <div key={f.kunci} className="rounded-lg border border-line p-3">
                    <p className="text-ink-faint">{f.label}</p>
                    <p className="mt-0.5 font-semibold text-ink">{f.tampil}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <AngkaLangsung />

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
            <li key={l.judul} className="card p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <l.ikon size={22} />
                </span>
                <span className="text-sm font-bold text-ink-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-bold">{l.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{l.isi}</p>
            </li>
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
            {AI.map((a) => (
              <li key={a.judul} className="flex flex-col rounded-2xl border border-line bg-paper p-6">
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
              </li>
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
          <Link to={`/laporan/${contoh.kode}`} className="btn-ghost mt-6">
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
    <section
      className="container-page relative z-10 -mt-4 pb-10 sm:-mt-6 sm:pb-14"
      aria-label="Angka langsung dari sistem"
    >
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
                    <p className="text-3xl font-extrabold tabular-nums text-brand-800">{a.nilai}</p>
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
