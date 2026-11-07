// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md § /metodologi, docs/SCORING.md, docs/DATA.md
// Semua angka di halaman ini dibaca dari @civicpulse/core dan data/processed, TIDAK diketik ulang,
// sehingga halaman ini selalu sama dengan rumus yang benar-benar dipakai sistem.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellOff, Calculator, Database, Gauge, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
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
import { LencanaPrioritas, RincianFaktor, warnaLevel } from '../components/Prioritas.jsx'
import { AMBANG_SARAN } from '../ai/index.js'
import registry from '../../../../ml/models.json'

const persen = (x) => `${Math.round(x * 100)}%`
const BAGIAN = [
  { id: 'skor', label: 'Skor prioritas' },
  { id: 'coba', label: 'Coba hitung' },
  { id: 'verifikasi', label: 'Verifikasi warga' },
  { id: 'kesenjangan', label: 'Kesenjangan & Wilayah Senyap' },
  { id: 'ai', label: 'Peran AI' },
  { id: 'data', label: 'Sumber data & batasan' },
]

const FAKTOR = [
  {
    kunci: 'risiko',
    nama: 'Risiko wilayah',
    sumber: 'IRBI · BNPB',
    cara: 'Indeks risiko bencana kab/kota untuk bahaya yang sesuai kategori laporan, sudah berskala 0–100.',
  },
  {
    kunci: 'riwayat',
    nama: 'Riwayat kejadian',
    sumber: 'DIBI · BNPB',
    cara: `Jumlah kejadian bencana terkait dalam 5 tahun ÷ ${NORMALISASI.kejadianMaks} × 100 (maks. 100).`,
  },
  {
    kunci: 'kemiskinan',
    nama: 'Kerentanan sosial',
    sumber: 'Kemiskinan · BPS',
    cara: `(% penduduk miskin − ${NORMALISASI.miskinMin}) ÷ (${NORMALISASI.miskinMaks} − ${NORMALISASI.miskinMin}) × 100, dibatasi 0–100.`,
  },
  {
    kunci: 'serupa',
    nama: 'Laporan serupa',
    sumber: 'Laporan warga',
    cara: `Warga lain yang melapor/+1 kategori sama dalam ${ATURAN_LAPORAN.serupaRadiusMeter} m & ${ATURAN_LAPORAN.serupaHari} hari ÷ ${NORMALISASI.serupaMaks} × 100 (maks. 100).`,
  },
]

const sumberAI = [registry.model[registry.aktif.vision], registry.model[registry.aktif.llm]]

export default function Metodologi() {
  return (
    <section className="container-page py-10 sm:py-14">
      <p className="eyebrow">Transparansi</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Metodologi & Data</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Setiap angka di CivicPulse bisa dihitung ulang siapa saja. Halaman ini membaca rumus langsung dari kode yang
        dipakai sistem, jadi isinya tidak pernah berbeda dengan perhitungan sebenarnya.
      </p>
      <p className="mt-2 text-sm text-ink-faint">
        Versi rumus <strong className="text-ink">{VERSI_RUMUS}</strong>
        {DATA_ILUSTRASI && (
          <>
            {' '}
            · <span className="tag-ilustrasi">Data wilayah masih ilustrasi</span>
          </>
        )}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Daftar isi" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {BAGIAN.map((b) => (
              <li key={b.id}>
                <a
                  href={`#${b.id}`}
                  className="block rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink-soft hover:text-ink lg:border-0 lg:bg-transparent lg:px-2"
                >
                  {b.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-12">
          <Bagian id="skor" ikon={Gauge} judul="Skor prioritas 0–100">
            <p>
              Setiap laporan diberi skor dari empat faktor. Tiap faktor diubah ke skala 0–100, dikalikan bobotnya, lalu
              dijumlahkan.
            </p>
            <div className="mt-5 rounded-2xl bg-ink p-5 font-mono text-sm leading-relaxed text-white sm:text-base">
              Skor ={' '}
              {FAKTOR.map((f, i) => (
                <span key={f.kunci}>
                  {i > 0 && ' + '}
                  <span className="text-brand-100">{persen(BOBOT[f.kunci])}</span> × {f.nama}
                </span>
              ))}
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-soft">
                    <th className="py-2 pr-3 font-semibold">Faktor</th>
                    <th className="py-2 pr-3 font-semibold">Bobot</th>
                    <th className="py-2 pr-3 font-semibold">Cara menjadi 0–100</th>
                    <th className="py-2 font-semibold">Sumber</th>
                  </tr>
                </thead>
                <tbody>
                  {FAKTOR.map((f) => (
                    <tr key={f.kunci} className="border-b border-line/60 align-top">
                      <td className="py-3 pr-3 font-semibold text-ink">{f.nama}</td>
                      <td className="py-3 pr-3">
                        <span className="font-bold tabular-nums text-ink">{persen(BOBOT[f.kunci])}</span>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-paper" aria-hidden="true">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: persen(BOBOT[f.kunci]) }} />
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-ink-soft">{f.cara}</td>
                      <td className="py-3 text-ink-soft">{f.sumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ['Tinggi', `≥ ${AMBANG.tinggi}`, 'Ditangani lebih dulu'],
                ['Sedang', `${AMBANG.sedang}–${AMBANG.tinggi - 1}`, 'Dijadwalkan'],
                ['Rendah', `< ${AMBANG.sedang}`, 'Dipantau'],
              ].map(([level, rentang, arti]) => (
                <div
                  key={level}
                  className={`rounded-xl border p-4 ${warnaLevel(level).latar} ${warnaLevel(level).garis}`}
                >
                  <p className={`font-bold ${warnaLevel(level).teks}`}>Prioritas {level}</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{rentang}</p>
                  <p className="text-sm text-ink-soft">{arti}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              Kenapa bobotnya begini? Risiko dan riwayat bencana adalah dasar yang paling objektif, jadi bobotnya
              terbesar. Kemiskinan memastikan wilayah yang paling sulit pulih tidak tertinggal, dan laporan serupa
              memberi suara pada warga tanpa membuat yang paling ramai otomatis menang.
            </p>
          </Bagian>

          <Bagian id="coba" ikon={Calculator} judul="Coba hitung sendiri">
            <p>
              Pilih wilayah dan jenis masalah. Angka di bawah dihitung dengan fungsi yang sama persis dengan sistem.
            </p>
            <Kalkulator />
          </Bagian>

          <Bagian id="verifikasi" ikon={ShieldCheck} judul="“Selesai” harus dibuktikan warga">
            <ol className="mt-1 space-y-3">
              {[
                'Instansi menandai laporan "klaim selesai". Instansi tidak pernah bisa menandai laporannya sendiri sebagai terverifikasi.',
                `Warga sekitar mengirim foto bukti yang diambil setelah tanggal klaim, dalam radius ${ATURAN_VERIFIKASI.radiusMeter} m dari titik laporan. Pelapor sendiri tidak bisa memverifikasi, dan satu perangkat hanya sekali.`,
                `Laporan menjadi terverifikasi bila minimal ${ATURAN_VERIFIKASI.target} warga menyatakan beres dan jumlahnya lebih banyak dari yang menyatakan belum.`,
                `Bila mayoritas menyatakan belum beres, atau ${ATURAN_VERIFIKASI.batasHari} hari berlalu tanpa cukup bukti, laporan otomatis dibuka ulang dan kembali ke antrean instansi.`,
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{t}</span>
                </li>
              ))}
            </ol>
          </Bagian>

          <Bagian id="kesenjangan" ikon={BellOff} judul="Skor kesenjangan & Wilayah Senyap">
            <p>
              <strong className="text-ink">Skor kesenjangan</strong> (0–100) mengukur jarak antara seberapa rawan sebuah
              kecamatan dan seberapa baik laporannya ditangani. Dipakai di peta dan daftar Perlu Perhatian di{' '}
              <Link to="/dasbor" className="font-semibold text-brand-700 underline">
                Dasbor
              </Link>
              .
            </p>
            <div className="mt-4 rounded-2xl bg-ink p-5 font-mono text-sm leading-relaxed text-white">
              Kesenjangan = <span className="text-brand-100">{persen(ATURAN_ANALITIK.bobotKesenjangan.risiko)}</span> ×
              risiko tertinggi +{' '}
              <span className="text-brand-100">{persen(ATURAN_ANALITIK.bobotKesenjangan.menumpuk)}</span> × laporan
              terbuka (÷ {ATURAN_ANALITIK.menumpukMaks}) +{' '}
              <span className="text-brand-100">{persen(ATURAN_ANALITIK.bobotKesenjangan.lambat)}</span> × umur rata-rata
              laporan terbuka (÷ {ATURAN_ANALITIK.lambatMaksHari} hari)
            </div>
            <p className="mt-4">
              <strong className="text-ink">Wilayah Senyap</strong> adalah kecamatan dengan risiko ≥{' '}
              {ATURAN_ANALITIK.risikoTinggi} yang laporannya dalam {ATURAN_ANALITIK.jendelaHari} hari terakhir kurang
              dari {persen(ATURAN_ANALITIK.senyapRasio)} rata-rata semua wilayah. Sepi belum tentu aman: bisa jadi
              warganya tidak tahu cara melapor, tidak punya akses, atau sudah tidak percaya.
            </p>
          </Bagian>

          <Bagian id="ai" ikon={Sparkles} judul="Peran AI: membantu, bukan memutuskan">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-ink">AI tidak pernah mengubah skor atau status.</strong> Skor hanya dari rumus
                di atas; status hanya dari instansi dan konfirmasi warga.
              </li>
              <li>
                Computer vision menyarankan kategori dari foto bila yakin ≥ {persen(AMBANG_SARAN)}, menyusun draf
                deskripsi, dan memberi tanda bila foto verifikasi tampak belum beres. Warga selalu bisa menolak saran.
              </li>
              <li>
                Model bahasa menulis ringkasan dasbor hanya dari angka yang ada. Bila ringkasannya memuat angka yang
                tidak ada di data, ringkasan itu otomatis ditolak dan diganti ringkasan berbasis aturan.
              </li>
              <li>Semua model berjalan di browser: gratis, tanpa kunci API, dan foto tidak dikirim ke layanan AI.</li>
            </ul>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-soft">
                    <th className="py-2 pr-3 font-semibold">Model</th>
                    <th className="py-2 pr-3 font-semibold">Tugas</th>
                    <th className="py-2 font-semibold">Status evaluasi</th>
                  </tr>
                </thead>
                <tbody>
                  {sumberAI.map((m) => (
                    <tr key={m.hfId} className="border-b border-line/60">
                      <td className="py-2 pr-3 font-mono text-xs text-ink">{m.hfId}</td>
                      <td className="py-2 pr-3">{m.tugas.join(', ')}</td>
                      <td className="py-2">{m.evaluasi ? 'dievaluasi' : `${m.status} (belum dievaluasi)`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bagian>

          <Bagian id="data" ikon={Database} judul="Sumber data & batasan">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-soft">
                    <th className="py-2 pr-3 font-semibold">Data</th>
                    <th className="py-2 pr-3 font-semibold">Instansi</th>
                    <th className="py-2 pr-3 font-semibold">Periode</th>
                    <th className="py-2 font-semibold">Tautan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(SUMBER_DATA).map((s) => (
                    <tr key={s.nama} className="border-b border-line/60">
                      <td className="py-2 pr-3 font-semibold text-ink">{s.nama}</td>
                      <td className="py-2 pr-3">{s.instansi}</td>
                      <td className="py-2 pr-3">{s.tahun ?? s.periode ?? 'menunggu impor'}</td>
                      <td className="py-2">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                            sumber
                          </a>
                        ) : (
                          '–'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <TriangleAlert size={16} /> Batasan yang perlu diketahui
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  IRBI, DIBI, dan data kemiskinan BPS tersedia per kabupaten/kota. Kecamatan dalam satu kab/kota memakai
                  nilai yang sama untuk faktor tersebut.
                </li>
                <li>
                  IRBI tidak memiliki bahaya &ldquo;kerusakan jalan&rdquo;. Risiko jalan memakai proksi: rata-rata
                  risiko banjir dan longsor kab/kota.
                </li>
                <li>
                  Data DIBI publik tidak mencakup kejadian terbaru; periode yang dipakai ditulis di tabel di atas.
                </li>
                <li>Kecamatan ditentukan dari titik pusat kecamatan terdekat, belum dari batas wilayah resmi.</li>
                {DATA_ILUSTRASI && (
                  <li>
                    <strong>Saat ini nilai wilayah masih data ilustrasi</strong> dan sedang diganti dengan hasil impor
                    data resmi.
                  </li>
                )}
              </ul>
            </div>
          </Bagian>
        </div>
      </div>
    </section>
  )
}

function Bagian({ id, ikon: Ikon, judul, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Ikon size={18} />
        </span>
        {judul}
      </h2>
      <div className="mt-4 leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}

function Kalkulator() {
  const [wilayahId, setWilayahId] = useState(WILAYAH[0].id)
  const [kategoriId, setKategoriId] = useState(KATEGORI[0].id)
  const [serupa, setSerupa] = useState(0)
  const wilayah = WILAYAH.find((w) => w.id === wilayahId)
  const p = hitungPrioritas(wilayah, kategoriId, serupa)
  const w = warnaLevel(p.level)
  const kelasInput =
    'mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500'

  return (
    <div className="mt-4 grid grid-cols-1 gap-5 rounded-2xl border border-line bg-white p-5 md:grid-cols-[1fr_1.3fr]">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-ink">
          Wilayah
          <select value={wilayahId} onChange={(e) => setWilayahId(e.target.value)} className={kelasInput}>
            {WILAYAH.map((x) => (
              <option key={x.id} value={x.id}>
                Kec. {x.kecamatan}, {x.kabupaten}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Jenis masalah
          <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} className={kelasInput}>
            {KATEGORI.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Warga lain yang melapor hal serupa: <span className="tabular-nums">{serupa}</span>
          <input
            type="range"
            min={0}
            max={NORMALISASI.serupaMaks + 2}
            value={serupa}
            onChange={(e) => setSerupa(Number(e.target.value))}
            className="mt-2 w-full accent-brand-600"
          />
        </label>
        <div className={`rounded-xl border p-4 ${w.latar} ${w.garis}`}>
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-extrabold tabular-nums ${w.teks}`}>{p.skor}</span>
            <LencanaPrioritas level={p.level} skor={p.skor} />
          </div>
          <p className="mt-2 text-sm text-ink">{p.penjelasan}</p>
        </div>
      </div>
      <div>
        <p className="mb-4 text-sm font-semibold text-ink">Rincian: nilai faktor × bobot</p>
        <RincianFaktor faktor={p.faktor} />
      </div>
    </div>
  )
}
