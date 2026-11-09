// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md § /peta
// Peta semua laporan: warna = level prioritas, cincin kosong = sudah terverifikasi warga.
// Filter kategori / status / wilayah (bisa dari URL: /peta?wilayah=dayeuhkolot&kategori=banjir&status=terbuka).
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { ArrowRight, ListFilter, MapPin, RotateCcw, ThumbsUp } from 'lucide-react'
import { KATEGORI, LABEL_STATUS, STATUS, STATUS_TERBUKA, kategoriById } from '@civicpulse/core'
import { api } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { PUSAT_PETA, TILE_ATRIBUSI, TILE_URL, WILAYAH, lokasiPendek, wilayahById } from '../lib/peta.js'
import { LencanaPrioritas } from '../components/Prioritas.jsx'
import KartuAi from '../components/KartuAi.jsx'
import SampulHalaman from '../components/SampulHalaman.jsx'

// Warna level prioritas (sama dengan token tinggi/sedang/rendah di tailwind.config.js).
const WARNA_LEVEL = { Tinggi: '#c2410c', Sedang: '#b7791f', Rendah: '#3f7d4e' }

const PILIHAN_STATUS = [
  { id: '', label: 'Semua status', cocok: () => true },
  { id: 'terbuka', label: 'Belum selesai', cocok: (s) => STATUS_TERBUKA.includes(s) },
  { id: 'klaim', label: 'Menunggu verifikasi warga', cocok: (s) => s === STATUS.KLAIM_SELESAI },
  { id: 'terverifikasi', label: 'Terverifikasi warga', cocok: (s) => s === STATUS.TERVERIFIKASI },
]

function GeserKe({ titik }) {
  const peta = useMap()
  useEffect(() => {
    if (titik) peta.flyTo(titik, Math.max(peta.getZoom(), 14), { duration: 0.6 })
  }, [titik, peta])
  return null
}

export default function Peta() {
  const [params, setParams] = useSearchParams()
  const kategoriId = params.get('kategori') ?? ''
  const wilayahId = params.get('wilayah') ?? ''
  const statusId = params.get('status') ?? ''
  const dipilih = params.get('kode')

  const { data, loading, error } = useApi(
    () => api.daftarLaporan({ kategoriId: kategoriId || undefined, wilayahId: wilayahId || undefined }),
    [kategoriId, wilayahId],
  )
  const cocokStatus = (PILIHAN_STATUS.find((p) => p.id === statusId) ?? PILIHAN_STATUS[0]).cocok
  const laporan = (data ?? []).filter((l) => cocokStatus(l.status)).sort((a, b) => b.prioritas.skor - a.prioritas.skor)
  const aktif = laporan.find((l) => l.kode === dipilih)
  // Ringkasan AI untuk wilayah yang dipilih di filter, atau wilayah laporan yang sedang diklik.
  const wilayahRingkas = wilayahId || aktif?.wilayahId || ''
  const pusat = wilayahId ? [wilayahById(wilayahId).lat, wilayahById(wilayahId).lng] : null

  const ubah = (kunci, nilai) => {
    const p = new URLSearchParams(params)
    nilai ? p.set(kunci, nilai) : p.delete(kunci)
    p.delete('kode')
    setParams(p, { replace: true })
  }
  const pilih = (kode) => {
    const p = new URLSearchParams(params)
    p.set('kode', kode)
    setParams(p, { replace: true })
  }
  const adaFilter = kategoriId || wilayahId || statusId

  // Buka popup marker yang dipilih dari daftar.
  const refMarker = useRef({})
  useEffect(() => {
    if (aktif) setTimeout(() => refMarker.current[aktif.kode]?.openPopup(), 650)
  }, [aktif])

  const kelasPilih =
    'min-h-[44px] w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500'

  return (
    <>
      <SampulHalaman
        halaman="peta"
        eyebrow="Dari Sabang sampai Merauke"
        judul="Peta Laporan"
        sub="Semua laporan warga beserta prioritas dan status tindak lanjutnya. Klik titik untuk melihat detail."
        kanan={
          <>
            {api.mode === 'lokal' && (
              <span
                className="tag-ilustrasi"
                title="Laporan warga di mode demo adalah contoh; data wilayah berasal dari BNPB & BPS"
              >
                Laporan contoh
              </span>
            )}
            <Link to="/lapor" className="btn-primary py-2.5">
              Lapor di sini <ArrowRight size={16} />
            </Link>
          </>
        }
      />
      <section className="container-page py-8 sm:py-10">
        {/* Filter: satu baris di atas peta */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="text-xs font-semibold text-ink-soft">
            Jenis masalah
            <select
              value={kategoriId}
              onChange={(e) => ubah('kategori', e.target.value)}
              className={`mt-1 ${kelasPilih}`}
            >
              <option value="">Semua jenis</option>
              {KATEGORI.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            Status
            <select value={statusId} onChange={(e) => ubah('status', e.target.value)} className={`mt-1 ${kelasPilih}`}>
              {PILIHAN_STATUS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            Kecamatan
            <select
              value={wilayahId}
              onChange={(e) => ubah('wilayah', e.target.value)}
              className={`mt-1 ${kelasPilih}`}
            >
              <option value="">Semua kecamatan</option>
              {WILAYAH.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.kecamatan}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            disabled={!adaFilter}
            className="btn-ghost min-h-[44px] self-end py-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-tinggi">
            {error.message}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="relative h-[420px] overflow-hidden rounded-2xl border border-line lg:h-[560px]">
              <MapContainer center={PUSAT_PETA} zoom={11} className="h-full w-full" scrollWheelZoom>
                <TileLayer attribution={TILE_ATRIBUSI} url={TILE_URL} />
                <GeserKe titik={aktif ? [aktif.lat, aktif.lng] : pusat} />
                {laporan.map((l) => {
                  const selesai = l.status === STATUS.TERVERIFIKASI
                  const warna = WARNA_LEVEL[l.prioritas.level]
                  return (
                    <CircleMarker
                      key={l.kode}
                      ref={(r) => (refMarker.current[l.kode] = r)}
                      center={[l.lat, l.lng]}
                      radius={l.kode === dipilih ? 12 : 9}
                      pathOptions={{
                        color: selesai ? warna : '#ffffff',
                        weight: selesai ? 3 : 2,
                        fillColor: warna,
                        fillOpacity: selesai ? 0.15 : 0.9,
                      }}
                      eventHandlers={{ click: () => pilih(l.kode) }}
                    >
                      <Popup>
                        <PopupLaporan laporan={l} />
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
              {loading && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60 text-sm text-ink-soft">
                  Memuat laporan…
                </div>
              )}
            </div>
            <div
              className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft"
              aria-label="Legenda"
            >
              {Object.entries(WARNA_LEVEL).map(([level, warna]) => (
                <span key={level} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full border-2 border-white"
                    style={{ background: warna }}
                    aria-hidden="true"
                  />
                  Prioritas {level}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-ink-soft bg-white" aria-hidden="true" />
                Terverifikasi warga
              </span>
            </div>
          </div>

          <aside className="card flex max-h-[600px] flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
              <p className="flex items-center gap-2 font-bold">
                <ListFilter size={16} className="text-brand-600" /> {loading ? '…' : laporan.length} laporan
              </p>
              <span className="text-xs text-ink-faint">urut prioritas tertinggi</span>
            </div>
            {!loading && !laporan.length && (
              <p className="p-5 text-sm text-ink-soft">Tidak ada laporan yang cocok dengan filter ini.</p>
            )}
            <ul className="flex-1 divide-y divide-line overflow-y-auto">
              {laporan.map((l) => (
                <li key={l.kode}>
                  <button
                    type="button"
                    onClick={() => pilih(l.kode)}
                    aria-pressed={l.kode === dipilih}
                    className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-paper ${
                      l.kode === dipilih ? 'bg-brand-50' : ''
                    }`}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: WARNA_LEVEL[l.prioritas.level] }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{l.judul}</span>
                      <span className="block text-xs text-ink-faint">
                        {lokasiPendek(wilayahById(l.wilayahId))} · {LABEL_STATUS[l.status]}
                      </span>
                    </span>
                    <span className="text-sm font-bold tabular-nums text-ink">{l.prioritas.skor}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {wilayahRingkas && (
          <KartuAi
            key={wilayahRingkas}
            tugas="wilayah"
            body={{ wilayahId: wilayahRingkas }}
            className="mt-6"
            judul={`Ringkasan AI · ${lokasiPendek(wilayahById(wilayahRingkas))}`}
            sub="Kondisi laporan dan kerentanan wilayah ini, dirangkum dari data resmi."
            labelTombol="Ringkas wilayah"
            kosong="Pilih wilayah di filter atau klik laporan, lalu minta AI merangkum kondisi wilayahnya."
          />
        )}
      </section>
    </>
  )
}

function PopupLaporan({ laporan: l }) {
  return (
    <div className="min-w-[220px] font-sans">
      <p className="text-[11px] font-semibold text-ink-faint">
        {l.kode} · {kategoriById(l.kategoriId)?.label}
      </p>
      <p className="mt-1 text-sm font-bold leading-snug text-ink">{l.judul}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
        <MapPin size={12} /> {lokasiPendek(wilayahById(l.wilayahId))}
      </p>
      <div className="mt-2">
        <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {LABEL_STATUS[l.status]} · <ThumbsUp size={11} className="-mt-0.5 inline" /> {l.jumlahDukungan} warga ikut
        mengalami
      </p>
      <Link
        to={`/laporan/${l.kode}`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
      >
        Lihat detail & dukung <ArrowRight size={12} />
      </Link>
    </div>
  )
}
