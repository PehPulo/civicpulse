// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § /instansi/laporan/:kode
// Rute sudah terdaftar di App.jsx; cukup ganti isi file ini.
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ImageOff,
  Inbox,
  LoaderCircle,
  RotateCcw,
  ThumbsUp,
  Wrench,
} from 'lucide-react'
import {
  ATURAN_VERIFIKASI,
  LABEL_STATUS,
  PERAN,
  STATUS,
  kategoriById,
  ringkasVerifikasi,
  transisiBerikutnya,
  verifikasiSiklusAktif,
  waktuKlaimTerakhir,
} from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi, useAksi } from '../../hooks/useApi.js'
import { DATA_ILUSTRASI, wilayahById } from '../../lib/peta.js'
import { LencanaPrioritas, RincianFaktor } from '../../components/Prioritas.jsx'

const IKON_STATUS = {
  [STATUS.DITERIMA]: Inbox,
  [STATUS.DIPROSES]: Wrench,
  [STATUS.KLAIM_SELESAI]: ClipboardCheck,
  [STATUS.TERVERIFIKASI]: CheckCircle2,
  [STATUS.DIBUKA_ULANG]: RotateCcw,
}

const WARNA_STATUS = {
  [STATUS.KLAIM_SELESAI]: 'text-sedang',
  [STATUS.TERVERIFIKASI]: 'text-rendah',
  [STATUS.DIBUKA_ULANG]: 'text-tinggi',
}

const LABEL_PERAN = {
  [PERAN.SISTEM]: 'Sistem',
  [PERAN.INSTANSI]: 'Instansi',
  [PERAN.WARGA]: 'Warga',
  [PERAN.PUBLIK]: 'Publik',
}

const tampilWaktu = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

export default function TindakLanjut() {
  const { kode } = useParams()
  const { data: laporan, loading, error } = useApi(() => api.getLaporan(kode), [kode])
  const [ubahStatus, { proses, error: errorAksi }] = useAksi((p) => api.ubahStatus(kode, p))
  const [ke, setKe] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tanggapan, setTanggapan] = useState('')
  const [pesan, setPesan] = useState('')

  const kirim = async (event) => {
    event.preventDefault()
    if (proses || !ke) return
    setPesan('')
    const hasil = await ubahStatus({ ke, catatan: catatan.trim(), tanggapan: tanggapan.trim() })
    if (hasil) {
      setPesan(`Status diperbarui ke ${LABEL_STATUS[hasil.status]}.`)
      setKe('')
      setCatatan('')
      setTanggapan('')
    }
  }

  if (loading) {
    return (
      <section className="card animate-pulse p-6 motion-reduce:animate-none" aria-label="Memuat detail laporan">
        <div className="h-3 w-28 rounded bg-line" />
        <div className="mt-4 h-6 w-2/3 rounded bg-line" />
        <div className="mt-4 h-40 rounded-xl bg-line" />
        <div className="mt-4 h-4 w-1/2 rounded bg-line" />
      </section>
    )
  }

  if (error || !laporan) {
    return (
      <section className="card p-6" role="alert">
        <h1 className="text-xl font-extrabold tracking-tight">Laporan tidak dapat dimuat</h1>
        <p className="mt-2 text-sm text-tinggi">{error?.message ?? `Laporan ${kode} tidak ditemukan.`}</p>
        <Link to="/instansi" className="btn-ghost mt-4">
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke antrean
        </Link>
      </section>
    )
  }

  const IkonStatus = IKON_STATUS[laporan.status]
  const aksi = transisiBerikutnya(laporan.status, PERAN.INSTANSI)
  const ringkas = ringkasVerifikasi(laporan)
  const siklusAktif = verifikasiSiklusAktif(laporan)
  const adaKlaim = Boolean(waktuKlaimTerakhir(laporan))

  return (
    <section aria-label={`Tindak lanjut laporan ${laporan.kode}`}>
      <Link to="/instansi" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700">
        <ArrowLeft size={16} aria-hidden="true" /> Kembali ke antrean
      </Link>

      <div className="card mt-2 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold tabular-nums text-ink-faint">{laporan.kode}</span>
          <div className="flex flex-wrap items-center gap-2">
            {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
            <LencanaPrioritas level={laporan.prioritas.level} skor={laporan.prioritas.skor} />
          </div>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{laporan.judul}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          <span>Kec. {wilayahById(laporan.wilayahId)?.kecamatan ?? laporan.wilayahId}</span>
          <span>{kategoriById(laporan.kategoriId)?.label ?? laporan.kategoriId}</span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${WARNA_STATUS[laporan.status] ?? 'text-ink-soft'}`}
          >
            <IkonStatus size={15} aria-hidden="true" /> {LABEL_STATUS[laporan.status]}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <ThumbsUp size={15} aria-hidden="true" /> {laporan.jumlahDukungan} dukungan
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {laporan.fotoUrl ? (
            <img
              src={laporan.fotoUrl}
              alt={`Foto laporan ${laporan.kode}`}
              className="h-56 w-full rounded-xl border border-line object-cover"
            />
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-paper text-ink-faint">
              <ImageOff size={22} aria-hidden="true" />
              <p className="text-sm">Tanpa foto</p>
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-ink">Deskripsi warga</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{laporan.deskripsi}</p>
            <details className="mt-4 rounded-xl border border-line bg-paper p-4">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-brand-700">
                Kenapa skornya {laporan.prioritas.skor}?
              </summary>
              <div className="mt-4">
                <RincianFaktor faktor={laporan.prioritas.faktor} />
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight">Aksi instansi</h2>
        {aksi.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            Tidak ada aksi status yang tersedia untuk tahap ini.{' '}
            {laporan.status === STATUS.KLAIM_SELESAI
              ? 'Verifikasi warga sedang berjalan; sistem yang akan memutuskan langkah berikutnya.'
              : 'Laporan sudah selesai ditangani.'}
          </p>
        ) : (
          <form onSubmit={kirim} className="mt-3">
            <fieldset>
              <legend className="text-xs font-semibold text-ink-soft">Ubah status ke</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {aksi.map((tujuan) => {
                  const Ikon = IKON_STATUS[tujuan]
                  return (
                    <button
                      key={tujuan}
                      type="button"
                      onClick={() => setKe(tujuan)}
                      disabled={proses}
                      aria-pressed={ke === tujuan}
                      className={`btn ${ke === tujuan ? 'bg-brand-600 text-white hover:bg-brand-700' : 'btn-ghost'}`}
                    >
                      <Ikon size={16} aria-hidden="true" /> {LABEL_STATUS[tujuan]}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <label className="mt-4 block text-xs font-semibold text-ink-soft">
              Catatan riwayat (internal & linimasa)
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                disabled={proses || !ke}
                rows={3}
                placeholder="Contoh: Tim drainase dijadwalkan survei lokasi besok pagi."
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 disabled:opacity-50"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-ink-soft">
              Tanggapan publik (hak jawab, tampil di halaman warga)
              <textarea
                value={tanggapan}
                onChange={(e) => setTanggapan(e.target.value)}
                disabled={proses || !ke}
                rows={3}
                placeholder="Contoh: Perbaikan dijadwalkan minggu ini; mohon warga menghindari titik tersebut."
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 disabled:opacity-50"
              />
            </label>
            <button type="submit" disabled={proses || !ke} className="btn-primary mt-4">
              {proses ? (
                <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <ClipboardCheck size={16} aria-hidden="true" />
              )}
              {proses ? 'Menyimpan…' : 'Simpan perubahan status'}
            </button>
          </form>
        )}
        <p className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-3 text-xs text-brand-900">
          Status <strong>Terverifikasi warga</strong> hanya diberikan sistem setelah warga sekitar mengonfirmasi
          (minimal {ATURAN_VERIFIKASI.target} verifikasi sah dalam radius {ATURAN_VERIFIKASI.radiusMeter} m). Instansi
          tidak dapat menandainya sendiri; klaim selesai yang ditolak warga akan dibuka ulang otomatis setelah{' '}
          {ATURAN_VERIFIKASI.batasHari} hari.
        </p>
        {errorAksi && (
          <p role="alert" className="mt-3 rounded-xl border border-tinggi bg-orange-50 p-3 text-sm text-tinggi">
            {errorAksi.message}
          </p>
        )}
        {pesan && (
          <p role="status" className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">
            {pesan}
          </p>
        )}
      </div>

      <div className="card mt-4 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight">Verifikasi warga</h2>
        {!adaKlaim ? (
          <p className="mt-2 text-sm text-ink-soft">
            Verifikasi warga dibuka setelah instansi mengklaim selesai. Saat ini belum ada klaim.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              Siklus klaim terakhir: {tampilWaktu(waktuKlaimTerakhir(laporan))} ·{' '}
              <span className="tabular-nums font-semibold text-ink">
                {ringkas.beres} beres / {ringkas.belum} belum
              </span>{' '}
              dari {ringkas.total} verifikasi sah (target {ringkas.target}).
            </p>
            {siklusAktif.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Belum ada verifikasi warga pada siklus ini.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {siklusAktif.map((v, i) => (
                  <li key={`${v.waktu}-${i}`} className="rounded-xl border border-line bg-paper p-3 text-sm">
                    <span className={`font-semibold ${v.beres ? 'text-rendah' : 'text-tinggi'}`}>
                      {v.beres ? 'Sudah beres' : 'Belum beres'}
                    </span>
                    <span className="ml-2 text-xs text-ink-faint">{tampilWaktu(v.waktu)}</span>
                    {v.cek?.aiMeragukan && (
                      <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-sedang">
                        <AlertTriangle size={14} aria-hidden="true" /> AI meragukan foto ini — tetap dihitung sah, hanya
                        penanda bagi petugas.
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="card mt-4 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight">Riwayat status</h2>
        <ol className="mt-4 space-y-4 border-l border-line pl-5">
          {[...laporan.riwayat].reverse().map((e, i) => {
            const Ikon = IKON_STATUS[e.status]
            return (
              <li key={`${e.waktu}-${i}`} className="relative">
                <span
                  className={`absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full bg-white ${WARNA_STATUS[e.status] ?? 'text-ink-faint'}`}
                >
                  <Ikon size={14} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-ink">
                  {LABEL_STATUS[e.status]}{' '}
                  <span className="font-normal text-ink-faint">· {LABEL_PERAN[e.oleh] ?? e.oleh}</span>
                </p>
                <p className="text-xs text-ink-faint">{tampilWaktu(e.waktu)}</p>
                {e.catatan && <p className="mt-1 text-sm text-ink-soft">{e.catatan}</p>}
              </li>
            )
          })}
        </ol>
        {laporan.tanggapan && (
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-xs font-bold text-brand-900">Tanggapan publik · {laporan.tanggapan.petugas}</p>
            <p className="mt-1 text-sm text-brand-900">{laporan.tanggapan.isi}</p>
            <p className="mt-1 text-xs text-brand-700">{tampilWaktu(laporan.tanggapan.waktu)}</p>
          </div>
        )}
      </div>
    </section>
  )
}
