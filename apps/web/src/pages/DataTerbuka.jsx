// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md § /data
// Data terbuka: semua yang tampil di CivicPulse bisa diunduh dan diperiksa ulang.
// Hanya tampilan publik yang diekspor (tanpa identitas perangkat), lihat lib/ekspor.js + test/ekspor.test.js.
import { Link } from 'react-router-dom'
import { BarChart3, Bot, Download, FileSpreadsheet, Lock, MapPinned, Scale } from 'lucide-react'
import { kategoriById, LABEL_STATUS } from '@civicpulse/core'
import { api } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { DATA_ILUSTRASI, wilayahById } from '../lib/peta.js'
import { KOLOM_LAPORAN, keCsv, laporanUntukJson, unduh } from '../lib/ekspor.js'
import registry from '../../../../ml/models.json'

const hariIni = () => new Date().toISOString().slice(0, 10)
const json = (x) => JSON.stringify(x, null, 2)

const KOLOM_WILAYAH = [
  { kunci: 'id' },
  { kunci: 'kecamatan' },
  { kunci: 'kabupaten' },
  { kunci: 'lat' },
  { kunci: 'lng' },
  { kunci: 'persen_miskin', ambil: (w) => w.miskin },
  ...['banjir', 'longsor', 'jalan'].flatMap((b) => [
    { kunci: `risiko_${b}`, ambil: (w) => w.risiko[b] },
    { kunci: `kejadian5th_${b}`, ambil: (w) => w.kejadian5th[b] },
  ]),
]

export default function DataTerbuka() {
  const laporan = useApi(() => api.daftarLaporan(), [])
  const statistik = useApi(() => api.statistik(), [])
  const wilayah = useApi(() => api.daftarWilayah(), [])

  const urut = [...(laporan.data ?? [])].sort((a, b) => b.dibuat.localeCompare(a.dibuat))
  const konteks = (l) => [wilayahById(l.wilayahId)]

  const SET = [
    {
      ikon: FileSpreadsheet,
      judul: 'Laporan warga',
      isi: 'Semua laporan beserta status, skor prioritas, dukungan, dan jumlah verifikasi warga.',
      jumlah: laporan.data && `${laporan.data.length} laporan`,
      siap: Boolean(laporan.data),
      unduhan: [
        {
          label: 'CSV',
          aksi: () =>
            unduh(`civicpulse-laporan-${hariIni()}.csv`, keCsv(urut, KOLOM_LAPORAN, konteks), 'text/csv;charset=utf-8'),
        },
        {
          label: 'JSON',
          aksi: () => unduh(`civicpulse-laporan-${hariIni()}.json`, json(laporanUntukJson(urut)), 'application/json'),
        },
      ],
    },
    {
      ikon: BarChart3,
      judul: 'Statistik dasbor',
      isi: 'Angka yang sama dengan Dasbor Akuntabilitas: per status, per wilayah, tren mingguan, Wilayah Senyap.',
      jumlah: statistik.data && `dihitung ${new Date(statistik.data.dihitung).toLocaleDateString('id-ID')}`,
      siap: Boolean(statistik.data),
      unduhan: [
        {
          label: 'JSON',
          aksi: () => unduh(`civicpulse-statistik-${hariIni()}.json`, json(statistik.data), 'application/json'),
        },
      ],
    },
    {
      ikon: MapPinned,
      judul: 'Data wilayah',
      isi: 'Nilai risiko (IRBI), riwayat kejadian (DIBI), dan kemiskinan (BPS) per kecamatan yang dipakai rumus skor.',
      jumlah: wilayah.data && `${wilayah.data.wilayah.length} kecamatan`,
      siap: Boolean(wilayah.data),
      unduhan: [
        {
          label: 'CSV',
          aksi: () =>
            unduh(
              `civicpulse-wilayah-${hariIni()}.csv`,
              keCsv(wilayah.data.wilayah, KOLOM_WILAYAH),
              'text/csv;charset=utf-8',
            ),
        },
        {
          label: 'JSON',
          aksi: () => unduh(`civicpulse-wilayah-${hariIni()}.json`, json(wilayah.data), 'application/json'),
        },
      ],
    },
    {
      ikon: Bot,
      judul: 'Registry model AI',
      isi: 'Model, label prompt, dan prompt sistem LLM yang dipakai. Siapa saja bisa memeriksa cara AI diarahkan.',
      jumlah: `${Object.keys(registry.model).length} model`,
      siap: true,
      unduhan: [{ label: 'JSON', aksi: () => unduh('civicpulse-model-ai.json', json(registry), 'application/json') }],
    },
  ]

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Transparansi</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Data Terbuka</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Semua yang tampil di CivicPulse bisa kamu unduh, periksa, dan hitung ulang: wartawan, peneliti, DPRD, atau
            warga biasa. Tidak perlu daftar.
          </p>
        </div>
        {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
      </div>

      {laporan.error && (
        <p role="alert" className="mt-6 rounded-lg bg-orange-50 px-3 py-2 text-sm text-tinggi">
          {laporan.error.message}
        </p>
      )}

      <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {SET.map((s) => (
          <li key={s.judul} className="card flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.ikon size={22} />
              </span>
              <span className="text-xs font-semibold tabular-nums text-ink-faint">{s.jumlah ?? 'memuat…'}</span>
            </div>
            <h2 className="mt-4 text-lg font-bold">{s.judul}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-soft">{s.isi}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {s.unduhan.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={u.aksi}
                  disabled={!s.siap}
                  className="btn-ghost py-2"
                  aria-label={`Unduh ${s.judul} (${u.label})`}
                >
                  <Download size={16} /> {u.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="card mt-8 p-6">
        <h2 className="text-lg font-bold">Pratinjau: 5 laporan terbaru</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                {['Kode', 'Kategori', 'Kecamatan', 'Status', 'Skor', 'Dukungan'].map((h) => (
                  <th key={h} className="py-2 pr-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laporan.loading && (
                <tr>
                  <td colSpan={6} className="py-4 text-ink-faint">
                    Memuat…
                  </td>
                </tr>
              )}
              {!laporan.loading && !urut.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-ink-faint">
                    Belum ada laporan.
                  </td>
                </tr>
              )}
              {urut.slice(0, 5).map((l) => (
                <tr key={l.kode} className="border-b border-line/60">
                  <td className="py-2 pr-3">
                    <Link
                      to={`/laporan/${l.kode}`}
                      className="font-semibold tabular-nums text-brand-700 hover:underline"
                    >
                      {l.kode}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{kategoriById(l.kategoriId)?.label}</td>
                  <td className="py-2 pr-3">{wilayahById(l.wilayahId)?.kecamatan}</td>
                  <td className="py-2 pr-3">{LABEL_STATUS[l.status]}</td>
                  <td className="py-2 pr-3 tabular-nums">{l.prioritas.skor}</td>
                  <td className="py-2 tabular-nums">{l.jumlahDukungan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Kamus data: laporan warga (CSV)</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-soft">
                  <th className="py-2 pr-3 font-semibold">Kolom</th>
                  <th className="py-2 font-semibold">Arti</th>
                </tr>
              </thead>
              <tbody>
                {KOLOM_LAPORAN.map((k) => (
                  <tr key={k.kunci} className="border-b border-line/60">
                    <td className="py-2 pr-3 font-mono text-xs text-ink">{k.kunci}</td>
                    <td className="py-2 text-ink-soft">{k.arti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Lock size={18} className="text-brand-600" /> Yang tidak pernah dibuka
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
              <li>Identitas perangkat pelapor, pendukung, dan verifikator.</li>
              <li>Titik lokasi warga saat mengirim foto verifikasi.</li>
              <li>File foto (hanya keterangan ada/tidak). Data pribadi di foto sudah dihapus saat diunggah.</li>
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Scale size={18} className="text-brand-600" /> Cara memakai
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              Bebas dipakai, dianalisis, dan dibagikan ulang dengan menyebut sumber: <strong>CivicPulse</strong>. Data
              BNPB dan BPS di dalamnya tetap mengikuti ketentuan instansi asal. Cara skor dihitung dijelaskan di{' '}
              <Link to="/metodologi" className="font-semibold text-brand-700 underline">
                Metodologi
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
