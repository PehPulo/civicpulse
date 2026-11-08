// PEMILIK: Yance (sisi instansi) · halaman baru: Ezra · KONTRAK: docs/FRONTEND.md § /instansi/peta
// Peta kerja lapangan: laporan terbuka diwarnai menurut prioritas; cincin merah tebal = lewat target waktu.
// Daftar di samping mengikuti urutan prioritas, klik ⇒ peta terbang ke titik itu.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { ArrowRight, Map as IkonPeta } from 'lucide-react'
import { STATUS, STATUS_TERBUKA, kategoriById, slaLaporan, urutkanAntrean } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import {
  PUSAT_INDONESIA,
  TILE_ATRIBUSI,
  TILE_URL,
  kabkotaById,
  lokasiPendek,
  provinsiById,
  wilayahById,
} from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { LencanaPrioritas } from '../../components/Prioritas.jsx'
import { ChipSla, JudulHalaman, PesanGalat, WARNA_LEVEL_HEX } from '../../components/instansi/ui.jsx'

const TAMPIL = [
  { id: 'terbuka', label: 'Perlu tindakan', cocok: (s) => STATUS_TERBUKA.includes(s) },
  { id: 'klaim', label: 'Menunggu warga', cocok: (s) => s === STATUS.KLAIM_SELESAI },
  { id: 'semua', label: 'Semua', cocok: () => true },
]

function TerbangKe({ titik }) {
  const peta = useMap()
  useEffect(() => {
    if (titik) peta.flyTo(titik, 15, { duration: 0.6 })
  }, [titik, peta])
  return null
}

/** Pusat & zoom awal mengikuti cakupan: Indonesia, provinsi, atau kab/kota. */
function pusatCakupan(a) {
  if (a.kabkotaId) {
    const x = kabkotaById(a.kabkotaId)
    return { pusat: [x.lat, x.lng], zoom: 11 }
  }
  if (a.provinsiId) {
    const p = provinsiById(a.provinsiId)
    return { pusat: [p.lat, p.lng], zoom: 8 }
  }
  return { pusat: PUSAT_INDONESIA, zoom: 5 }
}

function PindahCakupan({ awal }) {
  const peta = useMap()
  useEffect(() => {
    peta.setView(awal.pusat, awal.zoom)
  }, [awal, peta])
  return null
}

export default function PetaTugas() {
  const k = useCakupan()
  const awal = useMemo(() => pusatCakupan(k.efektif), [k.efektif])
  const [tampil, setTampil] = useState('terbuka')
  const [fokus, setFokus] = useState(null)
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])

  const daftar = useMemo(() => {
    const cocok = TAMPIL.find((t) => t.id === tampil).cocok
    return urutkanAntrean(k.saring(data).filter((l) => cocok(l.status)))
  }, [data, tampil, k])
  const lewat = daftar.filter((l) => slaLaporan(l).lewat).length

  return (
    <div>
      <JudulHalaman
        ikon={IkonPeta}
        judul={k.menangani ? 'Peta tugas' : `Peta sebaran · ${k.namaCakupan}`}
        sub="Warna titik = level prioritas. Cincin merah tebal = lewat target waktu. Klik daftar untuk menuju titik."
        kanan={
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-line" role="group" aria-label="Tampilkan">
            {TAMPIL.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTampil(t.id)}
                aria-pressed={tampil === t.id}
                className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${tampil === t.id ? 'bg-brand-600 text-white' : 'text-ink-soft'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      <PesanGalat galat={error} />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-line/70 bg-white shadow-[0_2px_10px_-4px_rgba(15,31,46,0.12)]">
          <div className="h-[460px] lg:h-[calc(100vh-260px)] lg:min-h-[480px]">
            <MapContainer center={awal.pusat} zoom={awal.zoom} className="h-full w-full" scrollWheelZoom>
              <TileLayer url={TILE_URL} attribution={TILE_ATRIBUSI} />
              <PindahCakupan awal={awal} />
              <TerbangKe titik={fokus} />
              {daftar.map((l) => {
                const s = slaLaporan(l)
                return (
                  <CircleMarker
                    key={l.kode}
                    center={[l.lat, l.lng]}
                    radius={6 + l.prioritas.skor / 14}
                    pathOptions={{
                      color: s.lewat ? '#b91c1c' : '#ffffff',
                      weight: s.lewat ? 4 : 2,
                      fillColor: WARNA_LEVEL_HEX[l.prioritas.level],
                      fillOpacity: 0.9,
                    }}
                  >
                    <Popup>
                      <p className="font-bold">{l.judul}</p>
                      <p className="text-xs">
                        {l.kode} · skor {l.prioritas.skor} ·{' '}
                        {s.lewat ? `lewat ${Math.abs(s.sisaHari)} hari` : `sisa ${s.sisaHari} hari`}
                      </p>
                      <Link to={`/instansi/laporan/${l.kode}`} className="mt-1 inline-block font-semibold">
                        Tindak lanjuti →
                      </Link>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-line px-4 py-3 text-xs text-ink-soft">
            {Object.entries(WARNA_LEVEL_HEX).map(([lv, w]) => (
              <span key={lv} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: w }} /> {lv}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-[3px] border-red-700 bg-white" /> Lewat target
            </span>
            <span className="ml-auto tabular-nums">
              {daftar.length} titik · <strong className="text-tinggi">{lewat} lewat target</strong>
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line/70 bg-white xl:max-h-[calc(100vh-200px)] xl:overflow-y-auto">
          <p className="sticky top-0 border-b border-line bg-white px-4 py-3 text-[15px] font-bold text-brand-700">
            Urutan kerja ({daftar.length})
          </p>
          {loading && <p className="p-4 text-sm text-ink-soft">Memuat…</p>}
          <ol className="divide-y divide-line">
            {daftar.map((l, i) => (
              <li key={l.kode} className="flex items-start hover:bg-paper">
                <button
                  type="button"
                  onClick={() => setFokus([l.lat, l.lng])}
                  className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-4 text-left"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-[11px] font-bold tabular-nums text-ink-soft">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{l.judul}</span>
                    <span className="block text-xs text-ink-faint">
                      {lokasiPendek(wilayahById(l.wilayahId))} · {kategoriById(l.kategoriId)?.label}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
                      <ChipSla sla={slaLaporan(l)} />
                    </span>
                  </span>
                </button>
                <Link
                  to={`/instansi/laporan/${l.kode}`}
                  className="flex min-h-11 min-w-11 items-center justify-center self-center text-ink-faint hover:text-brand-700"
                  aria-label={`Buka ${l.kode}`}
                >
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
