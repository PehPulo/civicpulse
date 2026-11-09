// PEMILIK: Yance (sisi instansi) · desain ulang + fitur AI: Ezra · KONTRAK: docs/FRONTEND.md § /instansi/laporan/:kode
// Meja kerja petugas untuk satu laporan:
//   · Computer vision: analisis foto laporan (peringkat kategori + detail kondisi, dengan % keyakinan & waktu proses),
//     dan cek foto BUKTI hasil kerja sebelum klaim selesai (tampak beres/belum).
//   · LLM: draf tanggapan publik dari fakta terstruktur (server), petugas menyunting sebelum disimpan.
//   · Hitungan: target waktu (slaLaporan), rincian skor prioritas, ringkasan verifikasi warga (core).
// AI hanya memberi saran. Status & skor tetap ditentukan aturan di @civicpulse/core.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  History,
  ImageOff,
  Lock,
  MessagesSquare,
  Send,
  LoaderCircle,
  MapPin,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react'
import {
  ATURAN_VERIFIKASI,
  LABEL_STATUS,
  LABEL_TINGKAT,
  PERAN,
  STATUS,
  TINGKAT,
  arahanMenunggu,
  arahanUntuk,
  kategoriById,
  ringkasVerifikasi,
  slaLaporan,
  transisiBerikutnya,
  verifikasiSiklusAktif,
  waktuKlaimTerakhir,
} from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useAksi, useApi } from '../../hooks/useApi.js'
import { AI_DI_SERVER, analisisFoto, cekVerifikasi, drafTanggapan, fotoDariUrl } from '../../ai/index.js'
import { lokasiPanjang, lokasiPendek, wilayahById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { LencanaPrioritas, RincianFaktor } from '../../components/Prioritas.jsx'
import {
  Batang,
  ChipSla,
  IKON_STATUS,
  JudulHalaman,
  Kerangka,
  LencanaAi,
  LencanaStatus,
  Panel,
  persen,
  tampilWaktu,
} from '../../components/instansi/ui.jsx'
import KartuAi from '../../components/KartuAi.jsx'

const LABEL_PERAN = { sistem: 'Sistem', instansi: 'Instansi', warga: 'Warga', publik: 'Publik' }
const TEMPLAT_CATATAN = {
  [STATUS.DIPROSES]: [
    'Tim survei dijadwalkan ke lokasi.',
    'Diteruskan ke bidang terkait.',
    'Material sedang disiapkan.',
  ],
  [STATUS.KLAIM_SELESAI]: ['Perbaikan selesai dikerjakan.', 'Saluran sudah dibersihkan.', 'Lokasi sudah aman dilalui.'],
}

/** Tanggapan berbasis aturan bila AI tidak tersedia (tanpa mengarang). */
function tanggapanTemplate(l, ke, catatan) {
  const masalah = `${kategoriById(l.kategoriId)?.label?.toLowerCase() ?? 'masalah'} di ${lokasiPendek(wilayahById(l.wilayahId))}`
  const isi = {
    [STATUS.DIPROSES]: `Terima kasih atas laporan ${masalah}. Laporan ini sekarang diproses oleh petugas.`,
    [STATUS.KLAIM_SELESAI]: `Penanganan ${masalah} sudah kami nyatakan selesai. Mohon warga sekitar membantu memverifikasi hasilnya.`,
  }[ke]
  return `${isi}${catatan ? ` ${catatan.trim().replace(/\.?$/, '.')}` : ''} Pantau dengan kode ${l.kode}.`
}

function AnalisisCv({ laporan }) {
  const [st, setSt] = useState({ proses: false, hasil: null, galat: '' })
  const jalankan = async () => {
    setSt({ proses: true, hasil: null, galat: '' })
    const blob = await fotoDariUrl(laporan.fotoUrl)
    const hasil = blob ? await analisisFoto(blob, laporan.kategoriId) : null
    setSt({ proses: false, hasil, galat: hasil ? '' : 'Foto tidak dapat dianalisis saat ini.' })
  }
  const h = st.hasil
  const cocok = h && h.kategoriId === laporan.kategoriId
  const saranAwal = laporan.ai

  return (
    <Panel
      judul="Analisis foto (CV)"
      ikon={ScanSearch}
      kanan={
        laporan.fotoUrl && AI_DI_SERVER ? (
          <button type="button" onClick={jalankan} disabled={st.proses} className="btn-ghost min-h-9 py-1.5 text-xs">
            {st.proses ? <LoaderCircle size={14} className="motion-safe:animate-spin" /> : <ScanSearch size={14} />}
            {st.proses ? 'Menganalisis…' : h ? 'Analisis ulang' : 'Analisis foto'}
          </button>
        ) : null
      }
    >
      {saranAwal?.kategoriSaran && (
        <p className="mb-3 rounded-xl bg-violet-50 p-3 text-xs text-violet-900">
          Saat warga melapor, AI menyarankan <strong>{kategoriById(saranAwal.kategoriSaran)?.label}</strong> (
          {persen(saranAwal.yakin)} yakin). Warga memilih <strong>{kategoriById(laporan.kategoriId)?.label}</strong>.
        </p>
      )}
      {!laporan.fotoUrl && <p className="text-sm text-ink-soft">Laporan ini tidak memiliki foto.</p>}
      {laporan.fotoUrl && !AI_DI_SERVER && <p className="text-sm text-ink-soft">AI server tidak aktif.</p>}
      {laporan.fotoUrl && AI_DI_SERVER && !h && !st.proses && !st.galat && (
        <p className="text-sm text-ink-soft">
          Cek apakah foto sesuai kategori laporan dan kondisi apa yang terlihat. Foto dianalisis di server lalu dibuang.
        </p>
      )}
      {st.proses && <Kerangka baris={4} />}
      {st.galat && <p className="text-sm text-tinggi">{st.galat}</p>}
      {h && (
        <div className="space-y-4">
          <p
            className={`flex items-start gap-2 rounded-xl p-3 text-sm font-semibold ${cocok ? 'bg-green-50 text-rendah' : 'bg-amber-50 text-amber-900'}`}
          >
            {cocok ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
            {cocok
              ? `Foto cocok dengan kategori laporan (${persen(h.yakin)} yakin).`
              : `AI menduga ${kategoriById(h.kategoriId)?.label} (${persen(h.yakin)}), bukan ${kategoriById(laporan.kategoriId)?.label}. Periksa kategori.`}
          </p>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Peringkat kategori</p>
            <ul className="mt-2 space-y-2">
              {h.top3.map((k) => (
                <li key={k.kategoriId}>
                  <div className="flex justify-between text-sm">
                    <span className={k.kategoriId === laporan.kategoriId ? 'font-bold text-ink' : 'text-ink-soft'}>
                      {kategoriById(k.kategoriId)?.label}
                    </span>
                    <span className="tabular-nums text-ink-soft">{(k.yakin * 100).toFixed(1)}%</span>
                  </div>
                  <Batang nilai={k.yakin * 100} warna="bg-violet-500" label={kategoriById(k.kategoriId)?.label} />
                </li>
              ))}
            </ul>
          </div>
          {h.detail.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Kondisi yang terlihat</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {h.detail.map((d) => (
                  <li key={d.id} className="flex justify-between gap-3">
                    <span className="text-ink">{d.kalimat}</span>
                    <span className="shrink-0 tabular-nums text-ink-faint">{(d.yakin * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <LencanaAi>{h.modelVersi}</LencanaAi> {h.ms ? `${h.ms} ms di server` : ''} · zero-shot CLIP, akurasi uji
            top-1 84,1%
          </p>
        </div>
      )}
    </Panel>
  )
}

function FormTindakan({ laporan }) {
  const [ubahStatus, { proses, error }] = useAksi((p) => api.ubahStatus(laporan.kode, p))
  const aksi = transisiBerikutnya(laporan.status, PERAN.INSTANSI)
  const [ke, setKe] = useState(aksi[0] ?? '')
  const [catatan, setCatatan] = useState('')
  const [tanggapan, setTanggapan] = useState('')
  const [sumberTanggapan, setSumberTanggapan] = useState(null)
  const [drafProses, setDrafProses] = useState(false)
  const [bukti, setBukti] = useState(null)
  const [pratinjau, setPratinjau] = useState('')
  const [cekBukti, setCekBukti] = useState({ proses: false, hasil: null })
  const [pesan, setPesan] = useState('')

  useEffect(() => setKe(aksi[0] ?? ''), [laporan.status]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => pratinjau && URL.revokeObjectURL(pratinjau), [pratinjau])

  const pilihBukti = async (file) => {
    if (!file) return
    setBukti(file)
    setPratinjau(URL.createObjectURL(file))
    setCekBukti({ proses: true, hasil: null })
    setCekBukti({ proses: false, hasil: await cekVerifikasi(file, laporan.kategoriId) })
  }
  const hapusBukti = () => {
    setBukti(null)
    setPratinjau('')
    setCekBukti({ proses: false, hasil: null })
  }

  const draf = async () => {
    setDrafProses(true)
    const h = await drafTanggapan(laporan.kode, ke, catatan)
    if (h?.sumber === 'ai' && h.draf) {
      setTanggapan(h.draf)
      setSumberTanggapan({ ai: true, model: h.model, cache: h.cache })
    } else {
      setTanggapan(tanggapanTemplate(laporan, ke, catatan))
      setSumberTanggapan({ ai: false, alasan: h?.alasan ?? 'gagal' })
    }
    setDrafProses(false)
  }

  const kirim = async (e) => {
    e.preventDefault()
    if (proses || !ke) return
    setPesan('')
    const hasil = await ubahStatus({
      ke,
      catatan: catatan.trim(),
      tanggapan: tanggapan.trim(),
      bukti: ke === STATUS.KLAIM_SELESAI ? bukti : undefined,
    })
    if (hasil) {
      setPesan(`Status diperbarui ke ${LABEL_STATUS[hasil.status]}.`)
      setCatatan('')
      setTanggapan('')
      setSumberTanggapan(null)
      hapusBukti()
    }
  }

  if (aksi.length === 0)
    return (
      <Panel judul="Tindakan petugas" ikon={ClipboardCheck}>
        <p className="text-sm text-ink-soft">
          {laporan.status === STATUS.KLAIM_SELESAI
            ? 'Menunggu verifikasi warga. Sistem yang memutuskan langkah berikutnya.'
            : 'Laporan sudah terverifikasi warga. Tidak ada tindakan lagi.'}
        </p>
        {pesan && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">{pesan}</p>}
      </Panel>
    )

  const h = cekBukti.hasil
  return (
    <Panel judul="Tindakan petugas" ikon={ClipboardCheck}>
      <form onSubmit={kirim} className="space-y-4">
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wide text-ink-faint">Ubah status ke</legend>
          <div className="mt-2 grid gap-2">
            {aksi.map((t) => {
              const Ikon = IKON_STATUS[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setKe(t)}
                  aria-pressed={ke === t}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${ke === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink hover:border-brand-500'}`}
                >
                  <Ikon size={16} aria-hidden="true" /> {LABEL_STATUS[t]}
                </button>
              )
            })}
          </div>
        </fieldset>

        {ke === STATUS.KLAIM_SELESAI && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Foto bukti hasil kerja</p>
            {!bukti ? (
              <label className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-paper text-sm text-ink-soft hover:border-brand-500">
                <Camera size={20} aria-hidden="true" /> Ambil / pilih foto
                <span className="text-xs text-ink-faint">AI akan mengecek apakah tampak sudah beres</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => pilihBukti(e.target.files?.[0])}
                />
              </label>
            ) : (
              <div className="mt-2 overflow-hidden rounded-xl border border-line">
                <div className="relative">
                  <img src={pratinjau} alt="Pratinjau foto bukti" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={hapusBukti}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90"
                    aria-label="Hapus foto bukti"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-3 text-sm">
                  {cekBukti.proses && (
                    <span className="flex items-center gap-2 text-ink-soft">
                      <LoaderCircle size={14} className="animate-spin" /> AI mengecek foto…
                    </span>
                  )}
                  {h && (
                    <>
                      <p className={`flex items-center gap-2 font-semibold ${h.beres ? 'text-rendah' : 'text-tinggi'}`}>
                        {h.beres ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {h.beres ? 'Tampak sudah beres' : 'Tampak BELUM beres'} · {persen(h.yakin)} yakin
                      </p>
                      <div className="mt-2">
                        <Batang
                          nilai={(h.beres ? h.yakin : 1 - h.yakin) * 100}
                          warna={h.beres ? 'bg-rendah' : 'bg-tinggi'}
                          label="Skor beres"
                        />
                      </div>
                      {!h.beres && (
                        <p className="mt-2 text-xs text-ink-soft">
                          Pastikan pekerjaan benar selesai. Warga sekitar tetap memverifikasi, dan klaim yang ditolak
                          akan dibuka ulang.
                        </p>
                      )}
                      <p className="mt-2 flex items-center gap-2 text-xs text-ink-faint">
                        <LencanaAi>{h.modelVersi}</LencanaAi> {h.ms ? `${h.ms} ms` : ''}
                      </p>
                    </>
                  )}
                  {!cekBukti.proses && !h && (
                    <p className="text-xs text-ink-faint">AI tidak tersedia; foto tetap dilampirkan.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Catatan riwayat</span>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Apa yang dilakukan / dijadwalkan"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <span className="mt-1 flex flex-wrap gap-1.5">
            {(TEMPLAT_CATATAN[ke] ?? []).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCatatan(t)}
                className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-brand-50 hover:text-brand-900"
              >
                {t}
              </button>
            ))}
          </span>
        </label>

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Tanggapan publik</span>
            <button
              type="button"
              onClick={draf}
              disabled={drafProses || !ke}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-violet-50 px-3 text-xs font-bold text-violet-800 hover:bg-violet-100"
            >
              {drafProses ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {drafProses ? 'Menyusun…' : AI_DI_SERVER ? 'Draf dengan AI' : 'Isi templat'}
            </button>
          </div>
          <textarea
            value={tanggapan}
            onChange={(e) => {
              setTanggapan(e.target.value)
              if (sumberTanggapan?.ai) setSumberTanggapan({ ...sumberTanggapan, disunting: true })
            }}
            rows={4}
            maxLength={600}
            placeholder="Tampil di halaman warga sebagai hak jawab instansi"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          {sumberTanggapan && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
              {sumberTanggapan.ai ? (
                <>
                  <LencanaAi>{sumberTanggapan.model}</LencanaAi>
                  {sumberTanggapan.disunting ? 'sudah disunting petugas' : 'draf AI, baca dan sunting sebelum disimpan'}
                  {sumberTanggapan.cache && ' · cache, 0 token'}
                </>
              ) : (
                `Templat berbasis aturan (AI: ${sumberTanggapan.alasan}).`
              )}
            </p>
          )}
          <p className="mt-1 text-right text-[11px] tabular-nums text-ink-faint">{tanggapan.length}/600</p>
        </div>

        <button type="submit" disabled={proses || !ke} className="btn-primary min-h-11 w-full">
          {proses ? <LoaderCircle size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
          {proses ? 'Menyimpan…' : `Simpan: ${LABEL_STATUS[ke] ?? ''}`}
        </button>
        {error && (
          <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-tinggi">
            {error.message}
          </p>
        )}
        {pesan && (
          <p role="status" className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
            {pesan}
          </p>
        )}
        <p className="flex gap-2 rounded-xl bg-paper p-3 text-xs text-ink-soft">
          <ShieldCheck size={16} className="shrink-0 text-brand-600" aria-hidden="true" />
          “Terverifikasi warga” hanya diberikan sistem setelah ≥ {ATURAN_VERIFIKASI.target} warga dalam radius{' '}
          {ATURAN_VERIFIKASI.radiusMeter} m mengonfirmasi. Instansi tidak bisa menandainya sendiri.
        </p>
      </form>
    </Panel>
  )
}

const TEMPLAT_SUPERVISI = [
  'Mohon dipercepat, laporan sudah melewati target waktu.',
  'Mohon unggah foto bukti saat klaim selesai.',
  'Koordinasikan dengan BPBD untuk penanganan darurat.',
  'Mohon tanggapan publik diperbarui untuk warga.',
]

const ARAH_ARAHAN = { pusat: 'Pusat → Provinsi', provinsi: 'Provinsi → Kab/Kota' }

/**
 * Arahan berjenjang pada laporan ini. Kab/kota hanya melihat arahan dari provinsi (arahan pusat diteruskan lewat
 * provinsi); provinsi & pusat melihat seluruh rantai arahan.
 */
function DaftarSupervisi({ laporan, tingkat }) {
  const daftar = tingkat === TINGKAT.KABKOTA ? arahanUntuk(laporan, TINGKAT.KABKOTA) : (laporan.supervisi ?? [])
  if (!daftar.length) return null
  return (
    <Panel judul={`Arahan atasan (${daftar.length})`} ikon={MessagesSquare}>
      <ol className="space-y-2">
        {[...daftar].reverse().map((s, i) => (
          <li
            key={`${s.waktu}-${i}`}
            className={`rounded-xl border p-3 text-sm ${
              s.tingkat === TINGKAT.PUSAT ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'
            }`}
          >
            <p className="text-xs font-bold text-amber-900">
              {ARAH_ARAHAN[s.tingkat] ?? LABEL_TINGKAT[s.tingkat] ?? s.tingkat} · {s.oleh ?? 'Admin'}
            </p>
            <p className="mt-1 text-amber-950">{s.catatan}</p>
            <p className="mt-1 text-[11px] text-amber-800">{tampilWaktu(s.waktu)}</p>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

/**
 * Admin provinsi/pusat: tidak mengubah status, tetapi memberi arahan tertulis ke tingkat di bawahnya
 * (pusat ⇒ admin provinsi, provinsi ⇒ admin kab/kota). Provinsi bisa meneruskan arahan pusat yang menunggu.
 */
function FormSupervisi({ laporan, sla, tingkat }) {
  const [kirim, { proses, error }] = useAksi((c) => api.supervisi(laporan.kode, c))
  const [catatan, setCatatan] = useState('')
  const pusat = tingkat === TINGKAT.PUSAT
  const penerima = pusat ? 'admin provinsi' : 'admin kab/kota'
  const arahanPusat =
    !pusat && arahanMenunggu(laporan, TINGKAT.PROVINSI) ? arahanUntuk(laporan, TINGKAT.PROVINSI).at(-1) : null
  const [ok, setOk] = useState(false)
  const jalankan = async (e) => {
    e.preventDefault()
    setOk(false)
    if (await kirim(catatan.trim())) {
      setCatatan('')
      setOk(true)
    }
  }
  return (
    <Panel judul="Supervisi" ikon={ClipboardCheck}>
      <p className="text-sm text-ink-soft">
        Status ditangani admin kab/kota.{' '}
        {pusat
          ? 'Arahan Anda dikirim ke admin provinsi, yang meneruskannya ke admin kab/kota.'
          : 'Arahan Anda tampil di meja kerja admin kab/kota.'}
      </p>
      {arahanPusat && (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm">
          <p className="text-xs font-bold text-sky-900">Arahan dari pusat · {tampilWaktu(arahanPusat.waktu)}</p>
          <p className="mt-1 text-sky-950">{arahanPusat.catatan}</p>
          <button
            type="button"
            onClick={() => setCatatan(`Meneruskan arahan pusat: ${arahanPusat.catatan}`.slice(0, 280))}
            className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100"
          >
            <Send size={13} aria-hidden="true" /> Teruskan ke admin kab/kota
          </button>
        </div>
      )}
      {sla.lewat && (
        <p className="mt-3 rounded-xl bg-orange-50 p-3 text-xs font-semibold text-tinggi">
          Lewat target {String(Math.abs(sla.sisaHari)).replace('.', ',')} hari: layak diberi arahan.
        </p>
      )}
      <form onSubmit={jalankan} className="mt-4" aria-busy={proses}>
        <label htmlFor="catatan-supervisi" className="text-sm font-semibold">
          Catatan arahan
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEMPLAT_SUPERVISI.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCatatan(t)}
              className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-brand-50"
            >
              {t.split(',')[0]}
            </button>
          ))}
        </div>
        <textarea
          id="catatan-supervisi"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value.slice(0, 280))}
          rows={4}
          className="mt-2 w-full rounded-xl border border-line p-3 text-sm"
          placeholder="Contoh: mohon dipercepat, warga terdampak banyak."
        />
        <p className="text-right text-[11px] text-ink-faint">{catatan.length}/280</p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-tinggi">
            {error.message}
          </p>
        )}
        {ok && (
          <p role="status" className="mt-2 text-sm font-semibold text-rendah">
            Arahan terkirim ke {penerima}.
          </p>
        )}
        <button type="submit" disabled={proses || catatan.trim().length < 5} className="btn-primary mt-3 w-full">
          {proses ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} aria-hidden="true" />}
          Kirim arahan ke {penerima}
        </button>
      </form>
    </Panel>
  )
}

export default function TindakLanjut() {
  const k = useCakupan()
  const { kode } = useParams()
  const { data: l, loading, error } = useApi(() => api.getLaporan(kode), [kode])

  if (loading)
    return (
      <Panel>
        <Kerangka baris={6} />
      </Panel>
    )
  if (error || !l)
    return (
      <Panel judul="Laporan tidak dapat dimuat" ikon={AlertTriangle}>
        <p className="text-sm text-tinggi">{error?.message ?? `Laporan ${kode} tidak ditemukan.`}</p>
        <Link to="/instansi/antrean" className="btn-ghost mt-4">
          <ArrowLeft size={16} /> Kembali ke antrean
        </Link>
      </Panel>
    )

  const sla = slaLaporan(l)
  const ringkas = ringkasVerifikasi(l)
  const siklus = verifikasiSiklusAktif(l)
  const wilayah = wilayahById(l.wilayahId)

  return (
    <div>
      <JudulHalaman
        ikon={FileText}
        judul={l.judul}
        sub={`${l.kode} · ${kategoriById(l.kategoriId)?.label} · ${lokasiPanjang(wilayah)} · masuk ${tampilWaktu(l.dibuat)}`}
        kanan={
          <>
            <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
            <LencanaStatus status={l.status} label={LABEL_STATUS[l.status]} />
          </>
        }
      />
      <Link
        to="/instansi/antrean"
        className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-700"
      >
        <ArrowLeft size={16} /> Kembali ke antrean
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          {/* Angka kunci */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-line/70 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <Clock size={14} /> Target waktu
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">
                {sla.umurHari}
                <span className="text-sm font-semibold text-ink-faint"> / {sla.targetHari} hari</span>
              </p>
              <div className="mt-2">
                <Batang
                  nilai={sla.persen}
                  warna={sla.lewat ? 'bg-tinggi' : sla.mendekati ? 'bg-sedang' : 'bg-rendah'}
                  label="Pemakaian target waktu"
                />
              </div>
              <div className="mt-2">
                <ChipSla sla={sla} />
              </div>
            </div>
            <div className="rounded-2xl border border-line/70 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <ThumbsUp size={14} /> Dukungan warga
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{l.jumlahDukungan}</p>
              <p className="mt-1 text-xs text-ink-faint">menambah faktor “laporan serupa”</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <Users size={14} /> Verifikasi
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">
                {ringkas.total}
                <span className="text-sm font-semibold text-ink-faint"> / {ringkas.target}</span>
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {ringkas.beres} beres · {ringkas.belum} belum
              </p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <MapPin size={14} /> Lokasi
              </p>
              <p className="mt-1 text-sm font-bold">{lokasiPendek(wilayah)}</p>
              <a
                href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-semibold text-brand-700"
              >
                {l.lat.toFixed(5)}, {l.lng.toFixed(5)} ↗
              </a>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel judul="Laporan warga" ikon={FileText} padat>
              {l.fotoUrl ? (
                <img src={l.fotoUrl} alt={`Foto laporan ${l.kode}`} className="h-60 w-full object-cover" />
              ) : (
                <div className="flex h-60 flex-col items-center justify-center gap-2 bg-paper text-ink-faint">
                  <ImageOff size={22} /> <span className="text-sm">Tanpa foto</span>
                </div>
              )}
              {l.fotoKredit && <p className="px-5 pt-2 text-[11px] text-ink-faint">{l.fotoKredit}</p>}
              <p className="whitespace-pre-line p-5 text-sm leading-relaxed text-ink">{l.deskripsi}</p>
            </Panel>
            <AnalisisCv laporan={l} />
          </div>

          <Panel judul={`Kenapa skornya ${l.prioritas.skor}?`} ikon={ScanSearch}>
            <RincianFaktor faktor={l.prioritas.faktor} />
          </Panel>

          {k.dalamYurisdiksi(l) && (
            <Panel>
              <KartuAi
                polos
                key={l.kode}
                tugas="saran-tindakan"
                body={{ kode: l.kode }}
                judul="Saran tindakan AI"
                sub="Urgensi, langkah pertama di lapangan, dan hal yang perlu dikomunikasikan ke warga."
                labelTombol="Sarankan langkah"
              />
            </Panel>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel judul="Verifikasi warga" ikon={Users}>
              {!waktuKlaimTerakhir(l) ? (
                <p className="text-sm text-ink-soft">Dibuka setelah instansi mengklaim selesai.</p>
              ) : siklus.length === 0 ? (
                <p className="text-sm text-ink-soft">Belum ada verifikasi pada siklus ini.</p>
              ) : (
                <ul className="space-y-2">
                  {siklus.map((v, i) => (
                    <li key={`${v.waktu}-${i}`} className="rounded-xl bg-paper p-3 text-sm">
                      <span className={`font-semibold ${v.beres ? 'text-rendah' : 'text-tinggi'}`}>
                        {v.beres ? 'Sudah beres' : 'Belum beres'}
                      </span>
                      <span className="ml-2 text-xs text-ink-faint">{tampilWaktu(v.waktu)}</span>
                      {v.cek?.aiMeragukan && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-sedang">
                          <AlertTriangle size={13} /> AI meragukan foto ini (tetap sah, hanya penanda)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel judul="Riwayat" ikon={History}>
              <ol className="space-y-4 border-l-2 border-line pl-5">
                {[...l.riwayat].reverse().map((e, i) => {
                  const Ikon = IKON_STATUS[e.status]
                  return (
                    <li key={`${e.waktu}-${i}`} className="relative">
                      <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-line">
                        <Ikon size={13} className="text-brand-600" />
                      </span>
                      <p className="text-sm font-semibold text-ink">
                        {LABEL_STATUS[e.status]}{' '}
                        <span className="font-normal text-ink-faint">· {LABEL_PERAN[e.oleh] ?? e.oleh}</span>
                      </p>
                      <p className="text-xs text-ink-faint">{tampilWaktu(e.waktu)}</p>
                      {e.catatan && <p className="mt-1 text-sm text-ink-soft">{e.catatan}</p>}
                      {e.buktiUrl && (
                        <img
                          src={e.buktiUrl}
                          alt="Foto bukti petugas"
                          className="mt-2 h-24 w-36 rounded-lg object-cover ring-1 ring-line"
                        />
                      )}
                    </li>
                  )
                })}
              </ol>
              {l.tanggapan && (
                <div className="mt-4 rounded-xl bg-brand-50 p-3">
                  <p className="text-xs font-bold text-brand-900">Tanggapan publik · {l.tanggapan.petugas}</p>
                  <p className="mt-1 text-sm text-brand-900">{l.tanggapan.isi}</p>
                </div>
              )}
            </Panel>
          </div>
        </div>

        <div className="space-y-5 xl:sticky xl:top-[88px] xl:self-start">
          {!k.dalamYurisdiksi(l) ? (
            <Panel judul="Di luar wilayah Anda" ikon={Lock}>
              <p className="text-sm text-ink-soft">
                Laporan ini berada di luar yurisdiksi {k.labelTingkat.toLowerCase()} {k.namaYurisdiksi}. Anda hanya
                dapat melihatnya.
              </p>
            </Panel>
          ) : k.menangani ? (
            <FormTindakan laporan={l} />
          ) : (
            <FormSupervisi laporan={l} sla={sla} tingkat={k.tingkat} />
          )}
          <DaftarSupervisi laporan={l} tingkat={k.tingkat} />
        </div>
      </div>
    </div>
  )
}
