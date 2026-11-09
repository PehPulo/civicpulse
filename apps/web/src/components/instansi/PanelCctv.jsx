// CCTV publik resmi pemda di sekitar lokasi laporan (khusus petugas). Data dari backend: GET /cctv/laporan/:kode
// (wajib login petugas & laporan dalam yurisdiksi; data titik kamera tidak ikut terbundel di aplikasi warga).
// Tidak memutar siaran di sini: petugas membuka portal resmi pengelola, lalu meminta rekaman lewat jalur dinas.
import { useState } from 'react'
import { Camera, Check, Copy, ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import { ATURAN_CCTV, drafPermintaanRekaman } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { lokasiPanjang } from '../../lib/peta.js'
import { Kerangka, Panel, PesanGalat } from './ui.jsx'

export default function PanelCctv({ laporan, wilayah, penanda }) {
  const [draf, setDraf] = useState(null)
  const [tersalin, setTersalin] = useState(false)
  const { data, loading, error } = useApi(() => api.cctvLaporan(laporan.kode), [laporan.kode])
  const kamera = data?.kamera ?? []
  const portal = data?.portal ?? []
  const jauh = Boolean(data?.jauh)
  const portalUtama = kamera[0]?.portal ?? portal[0]

  const susun = () => {
    setTersalin(false)
    setDraf(
      drafPermintaanRekaman({
        laporan,
        kamera,
        portal: portalUtama,
        lokasi: lokasiPanjang(wilayah),
        petugas: penanda,
      }),
    )
  }
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(draf)
      setTersalin(true)
    } catch {
      setTersalin(false)
    }
  }

  return (
    <Panel
      judul="CCTV publik terdekat"
      ikon={Camera}
      kanan={<span className="text-xs text-ink-faint">radius {ATURAN_CCTV.radiusMeter / 1000} km</span>}
    >
      {loading && <Kerangka baris={2} />}
      <PesanGalat galat={error} />
      {jauh && kamera.length > 0 && (
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Tidak ada kamera dalam {ATURAN_CCTV.radiusMeter / 1000} km. Kamera terdekat (hingga{' '}
          {ATURAN_CCTV.radiusCadanganMeter / 1000} km) mungkin tidak merekam titik laporan, tetapi bisa menangkap arus
          atau kejadian di sekitarnya.
        </p>
      )}
      {loading || error ? null : kamera.length > 0 ? (
        <ul className="space-y-2">
          {kamera.map((c) => {
            const p = c.portal
            return (
              <li key={`${c.portal?.id}-${c.nama}-${c.lat}`} className="flex items-start gap-3 rounded-xl bg-paper p-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Camera size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{c.nama}</p>
                  <p className="text-xs text-ink-faint">
                    ±{c.jarakM} m ke arah {c.arah} · {p?.nama}
                  </p>
                </div>
                {p && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-brand-700 hover:bg-brand-50"
                  >
                    Buka siaran <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">
          {portal.length
            ? 'Titik kamera untuk area ini belum dibuka portal resmi. Cek kamera terdekat langsung di portal berikut.'
            : 'Belum ada portal CCTV publik resmi yang tercatat untuk wilayah ini.'}
        </p>
      )}

      {portal.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {portal.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink hover:border-brand-300 hover:text-brand-700"
            >
              {p.nama} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}

      {(kamera.length > 0 || portal.length > 0) && (
        <div className="mt-4 border-t border-line pt-3">
          {!draf ? (
            <button type="button" onClick={susun} className="btn-ghost min-h-10 text-sm">
              <FileText size={15} aria-hidden="true" /> Susun permintaan rekaman
            </button>
          ) : (
            <div>
              <label htmlFor="draf-cctv" className="text-xs font-bold text-ink-soft">
                Draf permintaan rekaman (waktu laporan ±{ATURAN_CCTV.jendelaJam} jam)
              </label>
              <textarea
                id="draf-cctv"
                value={draf}
                onChange={(e) => setDraf(e.target.value)}
                rows={10}
                className="mt-1 w-full rounded-xl border border-line bg-paper p-3 font-mono text-xs leading-relaxed text-ink focus-visible:ring-2 focus-visible:ring-brand-500/20"
              />
              <button type="button" onClick={salin} className="btn-ghost mt-2 min-h-10 text-sm">
                {tersalin ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {tersalin ? 'Tersalin' : 'Salin draf'}
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-faint">
        <ShieldCheck size={13} className="mt-px shrink-0" aria-hidden="true" />
        Hanya CCTV publik milik pemda. Rekaman umumnya tersimpan {ATURAN_CCTV.simpanHari.min}–
        {ATURAN_CCTV.simpanHari.maks} hari; dipakai untuk memastikan kondisi & waktu kejadian, bukan identifikasi orang.
        Tidak ditampilkan ke warga.
      </p>
    </Panel>
  )
}
