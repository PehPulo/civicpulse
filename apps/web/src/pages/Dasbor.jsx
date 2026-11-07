import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BellOff, CheckCircle2, Clock, Inbox, Sparkles } from 'lucide-react'
import { STATUS_TERBUKA } from '@civicpulse/core'
import { api } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { ringkasDasbor } from '../ai/index.js'
import { MemprosesAI } from '../components/AI.jsx'
import { DATA_ILUSTRASI } from '../lib/peta.js'

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
        {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi ikon={Inbox} label="Laporan masuk" nilai={fmt(stat.total)} />
        <Kpi ikon={AlertTriangle} label="Belum selesai" nilai={fmt(terbuka)} />
        <Kpi ikon={CheckCircle2} label="Klaim terbukti warga" nilai={`${fmt(stat.persenTerverifikasi)}%`} />
        <Kpi ikon={Clock} label="Median penanganan" nilai={`${fmt(stat.medianHariTangani)} hari`} />
      </div>

      <RingkasanAI stat={stat} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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

        <div className="card p-6">
          <h2 className="text-lg font-bold">Perlu Perhatian</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Kombinasi risiko tinggi, laporan menumpuk, dan penanganan lambat.
          </p>
          <ol className="mt-4 divide-y divide-line">
            {stat.perluPerhatian.map((w, i) => (
              <li key={w.wilayahId} className="flex items-center gap-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-sm font-bold tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">Kec. {w.kecamatan}</p>
                  <p className="text-sm tabular-nums text-ink-soft">
                    {w.terbuka} terbuka · rata-rata {fmt(w.rataUmurTerbukaHari)} hari · risiko {w.risikoMaks}
                  </p>
                </div>
                <span className="text-lg font-extrabold tabular-nums text-tinggi">{w.skorKesenjangan}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-ink-faint">
            Angka kanan = skor kesenjangan 0–100 ·{' '}
            <Link to="/metodologi" className="underline">
              cara menghitung
            </Link>
          </p>
        </div>
      </div>
    </section>
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

// LLM di browser: ringkasan naratif dari angka dasbor, dijaga agar tidak mengarang angka.
function RingkasanAI({ stat }) {
  const [hasil, setHasil] = useState(null)
  const [proses, setProses] = useState(false)

  const buat = async () => {
    setProses(true)
    setHasil(await ringkasDasbor(stat))
    setProses(false)
  }

  return (
    <div className="mt-6 rounded-2xl border-2 border-brand-500 bg-brand-50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles size={18} className="text-brand-600" /> Ringkasan untuk pembuat kebijakan
        </h2>
        <button type="button" onClick={buat} disabled={proses} className="btn-primary py-2">
          {proses ? 'Menyusun…' : hasil ? 'Susun ulang' : 'Buat ringkasan AI'}
        </button>
      </div>
      {proses && (
        <div className="mt-4">
          <MemprosesAI model="llm" teks="Model bahasa sedang menyusun ringkasan dari angka di bawah…" />
        </div>
      )}
      {hasil && !proses && (
        <>
          <p className="mt-4 leading-relaxed text-ink">{hasil.ringkasan}</p>
          <p className="mt-2 text-xs text-ink-faint">
            {hasil.sumber === 'ai'
              ? `Disusun AI (${hasil.modelVersi}) di perangkatmu, hanya dari angka di dasbor ini. Setiap angka sudah dicek otomatis.`
              : 'Ringkasan otomatis berbasis aturan (AI tidak tersedia atau keluarannya tidak lolos pengecekan angka).'}
          </p>
        </>
      )}
      {!hasil && !proses && (
        <p className="mt-3 text-sm text-ink-soft">
          AI berjalan langsung di browser: gratis dan tanpa mengirim data ke luar. Pemakaian pertama mengunduh model
          ±400 MB sekali saja (disarankan di laptop dengan Wi-Fi).
        </p>
      )}
    </div>
  )
}
