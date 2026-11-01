import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, Check, MapPin, MessageSquare, ThumbsUp, X } from 'lucide-react'
import { cariLaporan } from '../data/laporan.js'
import { kategoriById } from '../data/kategori.js'
import { LencanaPrioritas, RincianFaktor } from '../components/Prioritas.jsx'

const TAHAP = [
  { kunci: 'diterima', label: 'Diterima' },
  { kunci: 'diproses', label: 'Diproses instansi' },
  { kunci: 'klaim', label: 'Klaim selesai' },
  { kunci: 'terverifikasi', label: 'Terverifikasi warga' },
]

const formatTanggal = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export default function DetailLaporan() {
  const { kode } = useParams()
  const laporan = cariLaporan(kode)
  const [dukungan, setDukungan] = useState(false)
  const [suara, setSuara] = useState(null)

  if (!laporan) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="text-2xl font-extrabold">Laporan {kode} tidak ditemukan</h1>
        <p className="mt-2 text-ink-soft">Periksa kembali kode lacak, atau coba contoh CP-2026-0417.</p>
        <Link to="/laporan/CP-2026-0417" className="btn-primary mt-6">Buka contoh laporan</Link>
      </section>
    )
  }

  const { prioritas, wilayah } = laporan
  const sudahKlaim = laporan.status.some((s) => s.kunci === 'klaim')
  const ver = {
    ...laporan.verifikasi,
    ya: laporan.verifikasi.ya + (suara === 'ya' ? 1 : 0),
    tidak: laporan.verifikasi.tidak + (suara === 'tidak' ? 1 : 0),
  }
  const totalSuara = ver.ya + ver.tidak

  return (
    <section className="container-page py-10 sm:py-14">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Beranda
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold tabular-nums text-ink-faint">{laporan.kode} · dilaporkan {formatTanggal(laporan.dibuat)}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{laporan.judul}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-ink-soft">
            <MapPin size={16} /> Kec. {wilayah.kecamatan}, {wilayah.kabupaten}
            <span aria-hidden="true">·</span> {kategoriById(laporan.kategori).label}
          </p>
        </div>
        <LencanaPrioritas level={prioritas.level} skor={prioritas.skor} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-brand-100 to-paper text-brand-700">
              <span className="flex flex-col items-center gap-2 text-sm font-medium">
                <Camera size={28} /> Foto laporan warga
              </span>
            </div>
            <p className="p-6 leading-relaxed text-ink">{laporan.deskripsi}</p>
          </div>

          {/* Linimasa status */}
          <div className="card p-6">
            <h2 className="text-lg font-bold">Linimasa tindak lanjut</h2>
            <ol className="mt-5">
              {TAHAP.map((t, i) => {
                const data = laporan.status.find((s) => s.kunci === t.kunci)
                const terverifikasi = t.kunci === 'terverifikasi'
                const selesai = Boolean(data)
                return (
                  <li key={t.kunci} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < TAHAP.length - 1 && (
                      <span className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${selesai ? 'bg-brand-500' : 'bg-line'}`} aria-hidden="true" />
                    )}
                    <span className={`z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      selesai ? 'bg-brand-600 text-white' : terverifikasi && sudahKlaim ? 'border-2 border-dashed border-brand-500 bg-white' : 'border-2 border-line bg-white'
                    }`}>
                      {selesai && <Check size={14} />}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between gap-x-3">
                        <p className={`font-semibold ${selesai || (terverifikasi && sudahKlaim) ? 'text-ink' : 'text-ink-faint'}`}>{t.label}</p>
                        {data && <p className="text-sm tabular-nums text-ink-faint">{formatTanggal(data.tanggal)}</p>}
                        {terverifikasi && sudahKlaim && <p className="text-sm tabular-nums text-brand-700">{ver.ya} / {ver.target} konfirmasi</p>}
                      </div>
                      {data && <p className="text-sm text-ink-soft">{data.catatan}</p>}
                      {terverifikasi && sudahKlaim && (
                        <p className="text-sm text-ink-soft">Menunggu foto berlokasi dari warga sekitar setelah tanggal klaim.</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {laporan.tanggapan && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold"><MessageSquare size={18} className="text-brand-600" /> Tanggapan instansi</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{laporan.tanggapan}</p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {/* Verifikasi warga */}
          <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-6">
            <h2 className="text-lg font-bold">Verifikasi warga</h2>
            {sudahKlaim ? (
              <>
                <p className="mt-1 text-sm text-ink-soft">Instansi menyatakan masalah ini selesai. Kamu tinggal di sekitar sini? Bantu buktikan.</p>
                <div className="mt-4 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(100, (ver.ya / ver.target) * 100)}%` }} />
                </div>
                <p className="mt-2 text-sm tabular-nums text-ink-soft">{ver.ya} dari {ver.target} warga mengonfirmasi · {totalSuara} suara</p>
                {suara ? (
                  <p className="mt-4 rounded-lg bg-white p-3 text-sm text-brand-900">Terima kasih. Suaramu tercatat dan akan dihitung setelah fotomu diperiksa.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setSuara('ya')} className="btn-primary px-3"><Check size={16} /> Sudah beres</button>
                    <button type="button" onClick={() => setSuara('tidak')} className="btn-ghost px-3"><X size={16} /> Belum</button>
                  </div>
                )}
                <p className="mt-3 text-xs text-ink-faint">Wajib menyertakan foto berlokasi yang diambil setelah tanggal klaim.</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">Verifikasi dibuka setelah instansi menyatakan masalah selesai.</p>
            )}
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Konteks wilayah</h2>
              <span className="tag-ilustrasi">Data ilustrasi</span>
            </div>
            <p className="mt-3 rounded-xl bg-paper p-4 text-sm leading-relaxed">“{prioritas.penjelasan}”</p>
            <div className="mt-5"><RincianFaktor faktor={prioritas.faktor} /></div>
          </div>

          <button
            type="button"
            onClick={() => setDukungan((d) => !d)}
            aria-pressed={dukungan}
            className={`btn w-full border ${dukungan ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink hover:border-ink-faint'}`}
          >
            <ThumbsUp size={16} /> {dukungan ? 'Kamu juga mengalami ini' : 'Saya juga mengalami (+1)'}
          </button>
        </aside>
      </div>
    </section>
  )
}
