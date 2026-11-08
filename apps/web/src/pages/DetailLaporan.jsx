import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Camera, Check, Crosshair, MapPin, MessageSquare, ThumbsUp, X } from 'lucide-react'
import { LABEL_STATUS, STATUS, kategoriById, ringkasVerifikasi } from '@civicpulse/core'
import { api } from '../services/api.js'
import { useAksi, useApi } from '../hooks/useApi.js'
import { DATA_ILUSTRASI, lokasiPanjang, wilayahById } from '../lib/peta.js'
import { waktuFoto } from '../lib/foto.js'
import { cekVerifikasi } from '../ai/index.js'
import { LencanaPrioritas, RincianFaktor } from '../components/Prioritas.jsx'
import { KotakAI, MemprosesAI, persenYakin } from '../components/AI.jsx'

const formatTanggal = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

// Tahap yang masih akan dilalui dari status saat ini (untuk linimasa).
const TAHAP_BERIKUT = {
  diterima: [STATUS.DIPROSES, STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI],
  diproses: [STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI],
  klaim_selesai: [STATUS.TERVERIFIKASI],
  dibuka_ulang: [STATUS.DIPROSES, STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI],
  terverifikasi: [],
}

export default function DetailLaporan() {
  const { kode } = useParams()
  const { data: laporan, loading, error } = useApi(() => api.getLaporan(kode), [kode])
  const [dukung, statusDukung] = useAksi(() => api.dukung(kode))

  if (loading) return <section className="container-page py-24 text-center text-ink-soft">Memuat laporan…</section>

  if (error || !laporan) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="text-2xl font-extrabold">Laporan {kode} tidak ditemukan</h1>
        <p className="mt-2 text-ink-soft">Periksa kembali kode lacak, atau coba contoh CP-2026-0417.</p>
        <Link to="/laporan/CP-2026-0417" className="btn-primary mt-6">
          Buka contoh laporan
        </Link>
      </section>
    )
  }

  const { prioritas } = laporan
  const wilayah = wilayahById(laporan.wilayahId)
  const sudahDukung = laporan.saya.pelapor || laporan.saya.dukung

  return (
    <section className="container-page py-10 sm:py-14">
      <Link to="/peta" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Peta laporan
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold tabular-nums text-ink-faint">
            {laporan.kode} · dilaporkan {formatTanggal(laporan.dibuat)}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{laporan.judul}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-ink-soft">
            <MapPin size={16} /> {lokasiPanjang(wilayah)}
            <span aria-hidden="true">·</span> {kategoriById(laporan.kategoriId).label}
          </p>
        </div>
        <LencanaPrioritas level={prioritas.level} skor={prioritas.skor} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            {laporan.fotoUrl ? (
              <img
                src={laporan.fotoUrl}
                alt={`Foto laporan: ${laporan.judul}`}
                className="aspect-[16/7] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-brand-100 to-paper text-brand-700">
                <span className="flex flex-col items-center gap-2 text-sm font-medium">
                  <Camera size={28} /> Foto laporan warga
                </span>
              </div>
            )}
            {laporan.fotoKredit && <p className="px-6 pt-2 text-[11px] text-ink-faint">{laporan.fotoKredit}</p>}
            <p className="p-6 leading-relaxed text-ink">{laporan.deskripsi}</p>
          </div>

          <Linimasa laporan={laporan} />

          {laporan.tanggapan && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <MessageSquare size={18} className="text-brand-600" /> Tanggapan instansi
              </h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{laporan.tanggapan.isi}</p>
              <p className="mt-2 text-xs text-ink-faint">
                {laporan.tanggapan.petugas} · {formatTanggal(laporan.tanggapan.waktu)}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <PanelVerifikasi laporan={laporan} />

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Konteks wilayah</h2>
              {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
            </div>
            <p className="mt-3 rounded-xl bg-paper p-4 text-sm leading-relaxed">“{prioritas.penjelasan}”</p>
            <div className="mt-5">
              <RincianFaktor faktor={prioritas.faktor} />
            </div>
            <p className="mt-4 text-xs text-ink-faint">
              Rumus v{prioritas.versiRumus} ·{' '}
              <Link to="/metodologi" className="underline">
                lihat metodologi
              </Link>
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={dukung}
              disabled={sudahDukung || statusDukung.proses}
              aria-pressed={sudahDukung}
              className={`btn w-full border ${
                sudahDukung
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-white text-ink hover:border-ink-faint'
              }`}
            >
              <ThumbsUp size={16} />
              {sudahDukung ? 'Kamu juga mengalami ini' : 'Saya juga mengalami (+1)'}
              <span className="tabular-nums opacity-80">· {laporan.jumlahDukungan}</span>
            </button>
            {statusDukung.error && <p className="mt-2 text-sm text-tinggi">{statusDukung.error.message}</p>}
          </div>
        </aside>
      </div>
    </section>
  )
}

function Linimasa({ laporan }) {
  const ver = ringkasVerifikasi(laporan)
  const berikut = TAHAP_BERIKUT[laporan.status]
  const baris = [
    ...laporan.riwayat.map((e) => ({ ...e, selesai: true })),
    ...berikut.map((s, i) => ({ status: s, selesai: false, aktif: i === 0 })),
  ]
  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold">Linimasa tindak lanjut</h2>
      <ol className="mt-5">
        {baris.map((b, i) => {
          const ulang = b.status === STATUS.DIBUKA_ULANG
          const menungguVerifikasi =
            !b.selesai && b.status === STATUS.TERVERIFIKASI && laporan.status === STATUS.KLAIM_SELESAI
          return (
            <li key={`${b.status}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
              {i < baris.length - 1 && (
                <span
                  className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${b.selesai ? 'bg-brand-500' : 'bg-line'}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  b.selesai
                    ? ulang
                      ? 'bg-tinggi text-white'
                      : 'bg-brand-600 text-white'
                    : menungguVerifikasi
                      ? 'border-2 border-dashed border-brand-500 bg-white'
                      : 'border-2 border-line bg-white'
                }`}
              >
                {b.selesai && (ulang ? <AlertTriangle size={12} /> : <Check size={14} />)}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap justify-between gap-x-3">
                  <p className={`font-semibold ${b.selesai || menungguVerifikasi ? 'text-ink' : 'text-ink-faint'}`}>
                    {LABEL_STATUS[b.status]}
                  </p>
                  {b.waktu && <p className="text-sm tabular-nums text-ink-faint">{formatTanggal(b.waktu)}</p>}
                  {menungguVerifikasi && (
                    <p className="text-sm tabular-nums text-brand-700">
                      {ver.beres} / {ver.target} konfirmasi
                    </p>
                  )}
                </div>
                {b.catatan && <p className="text-sm text-ink-soft">{b.catatan}</p>}
                {menungguVerifikasi && (
                  <p className="text-sm text-ink-soft">
                    Menunggu foto berlokasi dari warga sekitar setelah tanggal klaim.
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function PanelVerifikasi({ laporan }) {
  const ver = ringkasVerifikasi(laporan)
  const [beres, setBeres] = useState(null)
  const [file, setFile] = useState(null)
  const [aiCek, setAiCek] = useState(null)
  const [aiProses, setAiProses] = useState(false)
  const [lokasi, setLokasi] = useState(null)
  const [pesanGps, setPesanGps] = useState('')
  const [simulasi, setSimulasi] = useState(false)
  const [terkirim, setTerkirim] = useState(false)
  const [kirim, status] = useAksi(async () => {
    const titik = simulasi ? { lat: laporan.lat, lng: laporan.lng } : lokasi
    const ai = aiCek // hasil cek AI saat foto dipilih; null bila belum selesai/gagal (tidak menunggu)
    const waktu = simulasi ? new Date().toISOString() : waktuFoto(file)
    await api.kirimVerifikasi(laporan.kode, { beres, foto: file, ...titik, waktuFoto: waktu, ai })
    setTerkirim(true)
  })

  // Computer vision: cek foto sesudah penanganan, berjalan di latar belakang.
  const pilihFoto = (f) => {
    setFile(f)
    setAiCek(null)
    if (!f) return
    setAiProses(true)
    cekVerifikasi(f, laporan.kategoriId)
      .then(setAiCek)
      .finally(() => setAiProses(false))
  }

  const pakaiGps = () => {
    if (!navigator.geolocation) return setPesanGps('Perangkat tidak mendukung GPS.')
    setPesanGps('Mencari lokasi…')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLokasi({ lat: p.coords.latitude, lng: p.coords.longitude })
        setPesanGps('Lokasi didapat.')
      },
      () => setPesanGps('Lokasi tidak bisa diakses.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const bisaKirim = beres !== null && file && (lokasi || simulasi) && !status.proses
  const bolehVerifikasi = !laporan.saya.pelapor && !laporan.saya.verifikasi

  if (laporan.status === STATUS.TERVERIFIKASI) {
    return (
      <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Check size={18} className="text-brand-600" /> Terverifikasi warga
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{ver.beres} warga sekitar mengonfirmasi masalah ini sudah beres.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-6">
      <h2 className="text-lg font-bold">Verifikasi warga</h2>
      {laporan.status !== STATUS.KLAIM_SELESAI ? (
        <p className="mt-1 text-sm text-ink-soft">
          {laporan.status === STATUS.DIBUKA_ULANG
            ? 'Warga menyatakan masalah belum beres. Menunggu instansi menangani ulang.'
            : 'Verifikasi dibuka setelah instansi menyatakan masalah selesai.'}
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-soft">
            Instansi menyatakan masalah ini selesai. Kamu tinggal di sekitar sini? Bantu buktikan.
          </p>
          <div className="mt-4 h-2 rounded-full bg-white">
            <div
              className="h-2 rounded-full bg-brand-600"
              style={{ width: `${Math.min(100, (ver.beres / ver.target) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm tabular-nums text-ink-soft">
            {ver.beres} dari {ver.target} warga mengonfirmasi · {ver.total} suara sah
          </p>

          {terkirim || laporan.saya.verifikasi ? (
            <p className="mt-4 rounded-lg bg-white p-3 text-sm text-brand-900">
              Terima kasih. Verifikasimu sudah tercatat.
            </p>
          ) : !bolehVerifikasi ? (
            <p className="mt-4 rounded-lg bg-white p-3 text-sm text-ink-soft">
              Pelapor tidak dapat memverifikasi laporannya sendiri.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={beres === true}
                  onClick={() => setBeres(true)}
                  className={beres === true ? 'btn-primary px-3' : 'btn-ghost px-3'}
                >
                  <Check size={16} /> Sudah beres
                </button>
                <button
                  type="button"
                  aria-pressed={beres === false}
                  onClick={() => setBeres(false)}
                  className={beres === false ? 'btn-primary px-3' : 'btn-ghost px-3'}
                >
                  <X size={16} /> Belum
                </button>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-line bg-white p-3 text-sm">
                <Camera size={18} className="text-ink-soft" />
                <span className="font-semibold text-brand-700">
                  {file ? file.name : 'Ambil / unggah foto kondisi terkini'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => pilihFoto(e.target.files?.[0] ?? null)}
                />
              </label>
              {aiProses && <MemprosesAI teks="AI sedang memeriksa foto…" />}
              {aiCek && (
                <KotakAI nada={aiCek.beres ? 'netral' : 'peringatan'}>
                  AI: foto terlihat <strong>{aiCek.beres ? 'sudah beres' : 'masih bermasalah'}</strong> (
                  {persenYakin(aiCek.yakin)} yakin). Ini hanya saran; jawabanmu yang dihitung.
                </KotakAI>
              )}
              <button type="button" onClick={pakaiGps} className="btn-ghost w-full py-2">
                <Crosshair size={16} /> Pakai lokasi saya
              </button>
              {pesanGps && <p className="text-xs text-ink-soft">{pesanGps}</p>}
              {api.mode === 'lokal' && (
                <label className="flex items-center gap-2 text-xs text-ink-soft">
                  <input type="checkbox" checked={simulasi} onChange={(e) => setSimulasi(e.target.checked)} />
                  Mode demo: anggap saya berada di lokasi laporan, foto diambil sekarang
                </label>
              )}
              <button type="button" disabled={!bisaKirim} onClick={kirim} className="btn-primary w-full">
                {status.proses ? 'Memeriksa foto…' : 'Kirim verifikasi'}
              </button>
              {status.error && (
                <p role="alert" className="rounded-lg bg-white p-3 text-sm text-tinggi">
                  {status.error.message}
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-ink-faint">Foto harus diambil dalam radius 200 m, setelah tanggal klaim.</p>
        </>
      )}
    </div>
  )
}
