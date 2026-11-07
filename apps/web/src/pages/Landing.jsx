import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  Database,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  CloudRain,
  History,
  Wallet,
} from 'lucide-react'
import { hitungPrioritas, kategoriById } from '@civicpulse/core'
import { wilayahById } from '../lib/peta.js'
import { LencanaPrioritas, warnaLevel } from '../components/Prioritas.jsx'

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

const SUMBER = [
  {
    ikon: CloudRain,
    nama: 'IRBI',
    lembaga: 'BNPB',
    isi: 'Indeks Risiko Bencana Indonesia per kabupaten/kota, 2015–2022.',
  },
  {
    ikon: History,
    nama: 'DIBI',
    lembaga: 'BNPB',
    isi: 'Data dan Informasi Bencana Indonesia, catatan kejadian 1815–2021.',
  },
  {
    ikon: Wallet,
    nama: 'Kemiskinan',
    lembaga: 'BPS',
    isi: 'Persentase penduduk miskin kabupaten/kota, rilis 28 November 2025.',
  },
]

// Ilustrasi masalah: urutan berdasarkan jumlah dukungan vs berdasarkan skor konteks.
const ANTREAN = [
  { judul: 'Trotoar retak di pusat kota', wilayah: 'Coblong', dukungan: 48, skor: 31 },
  { judul: 'Lampu taman mati', wilayah: 'Sukajadi', dukungan: 35, skor: 27 },
  { judul: 'Drainase tersumbat dekat sungai', wilayah: 'Dayeuhkolot', dukungan: 3, skor: 73 },
]

// Kartu ilustrasi di hero: dihitung langsung dengan rumus yang sama seperti laporan sungguhan.
const CONTOH = {
  kode: 'CP-2026-0417',
  judul: 'Saluran air tersumbat sampah di depan pasar',
  kategoriId: 'drainase',
  wilayah: wilayahById('dayeuhkolot'),
  prioritas: hitungPrioritas(wilayahById('dayeuhkolot'), 'drainase', 4),
}

export default function Landing() {
  const contoh = CONTOH
  const navigate = useNavigate()
  const [kode, setKode] = useState('')

  const lacak = (e) => {
    e.preventDefault()
    if (kode.trim()) navigate(`/laporan/${kode.trim()}`)
  }

  return (
    <>
      {/* HERO */}
      <section className="container-page grid items-center gap-12 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <p className="eyebrow">Civic Reporting & Accountability</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Laporanmu punya konteks. Yang paling berisiko ditangani lebih dulu.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            CivicPulse memperkaya setiap laporan warga dengan data publik dari lokasinya, memberi skor prioritas yang
            bisa dijelaskan, dan memastikan status selesai dibuktikan oleh warga sekitar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/lapor" className="btn-primary">
              Lapor Sekarang <ArrowRight size={18} />
            </Link>
            <a href="#cara-kerja" className="btn-ghost">
              Lihat cara kerja
            </a>
          </div>

          <form
            onSubmit={lacak}
            className="mt-8 flex max-w-md items-center gap-2 rounded-xl border border-line bg-white p-1.5"
          >
            <Search size={18} className="ml-2 shrink-0 text-ink-faint" aria-hidden="true" />
            <label htmlFor="kode-lacak" className="sr-only">
              Kode lacak laporan
            </label>
            <input
              id="kode-lacak"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Kode lacak, mis. CP-2026-0417"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-ink-faint"
            />
            <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
              Lacak
            </button>
          </form>
        </div>

        {/* Kartu contoh laporan berkonteks */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand-50" aria-hidden="true" />
          <article className="card p-6 shadow-[0_20px_50px_-24px_rgba(15,31,46,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-faint">{contoh.kode}</span>
              <span className="tag-ilustrasi">Contoh</span>
            </div>
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
      </section>

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
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
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
        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
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

      {/* DATA PUBLIK */}
      <section className="container-page pb-20">
        <div className="grid gap-10 rounded-3xl bg-ink p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-100">Data publik asli</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Konteks dari sumber resmi, bukan tebakan.</h2>
            <p className="mt-4 text-white/70">
              Setiap faktor skor menyebut sumber datanya. Pada prototipe ini nilai wilayah masih data ilustrasi dan akan
              diganti hasil impor dataset resmi.
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
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AKUNTABILITAS */}
      <section className="container-page grid items-center gap-12 pb-8 md:grid-cols-2">
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
        <ol className="card space-y-5 p-6">
          {[
            ['Diterima', '12 Okt', 'Laporan masuk dan diperkaya data wilayah', true],
            ['Diproses', '14 Okt', 'Diteruskan ke Dinas PUTR', true],
            ['Klaim selesai', '20 Okt', 'Instansi menyatakan saluran sudah dikeruk', true],
            ['Terverifikasi warga', '1 / 3', 'Menunggu dua konfirmasi foto lagi', false],
          ].map(([judul, waktu, isi, sudah]) => (
            <li key={judul} className="flex gap-4">
              <span
                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${sudah ? 'bg-brand-600 text-white' : 'border-2 border-dashed border-brand-500 text-brand-600'}`}
              >
                {sudah ? <ShieldCheck size={14} /> : null}
              </span>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">{judul}</p>
                  <p className="text-sm tabular-nums text-ink-faint">{waktu}</p>
                </div>
                <p className="text-sm text-ink-soft">{isi}</p>
              </div>
            </li>
          ))}
        </ol>
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
