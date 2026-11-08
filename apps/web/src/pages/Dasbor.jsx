import { Link } from 'react-router-dom'
import { AlertTriangle, BellOff, CheckCircle2, Clock, FileText, Inbox } from 'lucide-react'
import { STATUS_TERBUKA } from '@civicpulse/core'
import { api } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { ringkasDasbor } from '../ai/index.js'
import { warnaKesenjangan } from '../lib/kesenjangan.js'
import GrafikMingguan from '../components/grafik/GrafikMingguan.jsx'
import PetaKesenjangan from '../components/grafik/PetaKesenjangan.jsx'

const fmt = (x) => (x == null ? '–' : x.toLocaleString('id-ID'))

export default function Dasbor() {
  const { data: stat, loading, error } = useApi(() => api.statistik(), [])

  if (loading) return <section className="container-page py-24 text-center text-ink-soft">Memuat dasbor…</section>
  if (error)
    return (
      <section className="container-page py-24 text-center" role="alert">
        {error.message}
      </section>
    )

  const terbuka = STATUS_TERBUKA.reduce((n, s) => n + (stat.perStatus[s] ?? 0), 0)
  const senyap = new Set(stat.wilayahSenyap.map((w) => w.wilayahId))
  const diperbarui = new Date(stat.dihitung).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Dasbor Akuntabilitas</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Wilayah mana yang rawan, laporannya menumpuk, atau justru tidak bersuara. Semua angka dihitung dari laporan
            warga dan data publik.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {api.mode === 'lokal' && (
            <span
              className="tag-ilustrasi"
              title="Laporan warga di mode demo adalah contoh; data wilayah berasal dari BNPB & BPS"
            >
              Laporan contoh
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Dihitung ulang setiap halaman dibuka · terakhir {diperbarui}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi ikon={Inbox} label="Laporan masuk" nilai={fmt(stat.total)} />
        <Kpi ikon={AlertTriangle} label="Belum selesai" nilai={fmt(terbuka)} />
        <Kpi ikon={CheckCircle2} label="Klaim terbukti warga" nilai={`${fmt(stat.persenTerverifikasi)}%`} />
        <Kpi ikon={Clock} label="Median penanganan" nilai={`${fmt(stat.medianHariTangani)} hari`} />
      </div>

      <Ringkasan stat={stat} />

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold">Tren 8 minggu terakhir</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Berapa laporan masuk dan berapa yang benar-benar terbukti beres oleh warga setiap minggu.
        </p>
        <div className="mt-4">
          <GrafikMingguan data={stat.mingguan} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Peta kesenjangan</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Makin gelap, makin besar jarak antara risiko wilayah dan penanganan yang diterimanya.
          </p>
          <div className="mt-4">
            <PetaKesenjangan wilayah={stat.perWilayah} senyap={senyap} />
          </div>
        </div>
        <PerluPerhatian daftar={stat.perluPerhatian} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BellOff size={18} className="text-tinggi" /> Wilayah Senyap
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Risiko bencana tinggi, tetapi laporannya jauh di bawah rata-rata. Warga di sini mungkin tidak bersuara,
            bukan tidak bermasalah.
          </p>
          {stat.wilayahSenyap.length ? (
            <ul className="mt-4 space-y-3">
              {stat.wilayahSenyap.map((w) => (
                <li key={w.wilayahId} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="font-semibold">
                    Kec. {w.kecamatan}, {w.kabupaten}
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-ink-soft">
                    Risiko {w.risikoMaks}/100 · {w.laporan30h} laporan dalam 30 hari (rata-rata wilayah{' '}
                    {fmt(w.rataLaporan30h)})
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">Tidak ada wilayah senyap saat ini.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function PerluPerhatian({ daftar }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold">Perlu Perhatian</h2>
      <p className="mt-1 text-sm text-ink-soft">Kombinasi risiko tinggi, laporan menumpuk, dan penanganan lambat.</p>
      <ol className="mt-4 space-y-4">
        {daftar.map((w, i) => (
          <li key={w.wilayahId}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">
                <span className="mr-2 tabular-nums text-ink-faint">{i + 1}.</span>Kec. {w.kecamatan}
              </p>
              <span className="text-lg font-extrabold tabular-nums text-ink">{w.skorKesenjangan}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
              <div
                className="h-full rounded-full"
                style={{ width: `${w.skorKesenjangan}%`, background: warnaKesenjangan(w.skorKesenjangan) }}
              />
            </div>
            <p className="mt-1 text-xs tabular-nums text-ink-soft">
              {w.terbuka} terbuka · rata-rata {fmt(w.rataUmurTerbukaHari)} hari · risiko {w.risikoMaks}/100
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-ink-faint">
        Angka kanan = skor kesenjangan 0–100 ·{' '}
        <Link to="/metodologi#kesenjangan" className="underline">
          cara menghitung
        </Link>
      </p>
    </div>
  )
}

function Kpi({ ikon: Ikon, label, nilai }) {
  return (
    <div className="card p-5">
      <Ikon size={18} className="text-brand-600" aria-hidden="true" />
      <p className="mt-3 text-2xl font-extrabold tabular-nums sm:text-3xl">{nilai}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  )
}

// Ringkasan naratif berbasis aturan, disusun langsung dari angka dasbor (selalu akurat, tanpa model bahasa).
function Ringkasan({ stat }) {
  const { ringkasan } = ringkasDasbor(stat)
  return (
    <div className="mt-6 rounded-2xl border-2 border-brand-500 bg-brand-50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <FileText size={18} className="text-brand-600" /> Ringkasan untuk pembuat kebijakan
      </h2>
      <p className="mt-4 leading-relaxed text-ink">{ringkasan}</p>
      <p className="mt-2 text-xs text-ink-faint">Disusun otomatis langsung dari angka di dasbor ini.</p>
    </div>
  )
}
