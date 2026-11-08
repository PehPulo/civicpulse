// Peta 3D per tingkat: pusat ⇒ 34 provinsi; provinsi ⇒ kab/kota di provinsinya; kab/kota ⇒ wilayahnya (tetangga
// diredupkan) + tiang laporan terbuka. Semua angka dari agregatWilayah() (@civicpulse/core), bukan perkiraan.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Globe2, Info, Layers, MousePointerClick, TimerOff } from 'lucide-react'
import { STATUS_TERBUKA, TINGKAT, agregatWilayah } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { INDEKS_WILAYAH, kabkotaById, provinsiById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { JudulHalaman, KartuAngka, Kerangka, Panel, angka } from '../../components/instansi/ui.jsx'

const Peta3D = lazy(() => import('../../components/instansi/Peta3D.jsx'))

const METRIK = [
  { id: 'terbuka', label: 'Laporan terbuka' },
  { id: 'lewatSla', label: 'Lewat target' },
  { id: 'total', label: 'Total laporan' },
]

const cacheGeo = new Map()
function useGeo(url) {
  const [geo, setGeo] = useState(() => cacheGeo.get(url) ?? null)
  const [galat, setGalat] = useState(null)
  useEffect(() => {
    if (cacheGeo.has(url)) return setGeo(cacheGeo.get(url))
    let hidup = true
    setGeo(null)
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((g) => {
        cacheGeo.set(url, g)
        if (hidup) setGeo(g)
      })
      .catch((e) => hidup && setGalat(e))
    return () => {
      hidup = false
    }
  }, [url])
  return { geo, galat }
}

export default function Peta3DWilayah() {
  const k = useCakupan()
  const { akses, efektif, setCakupan } = k
  const [metrik, setMetrik] = useState('terbuka')
  const [arah, setArah] = useState(null)
  const { data, loading } = useApi(() => api.daftarLaporan({}), [])

  // Tingkat peta: nasional (per provinsi) atau provinsi (per kab/kota).
  const nasional = efektif.tingkat === TINGKAT.PUSAT
  const kunci = nasional ? 'provinsiId' : 'kabkotaId'
  const url = nasional ? '/geo/provinsi.json' : `/geo/kabkota/${efektif.provinsiId}.json`
  const { geo, galat } = useGeo(url)
  const fokus = efektif.tingkat === TINGKAT.KABKOTA ? efektif.kabkotaId : null

  const dalamProvinsi = useMemo(
    () => (data ?? []).filter((l) => nasional || INDEKS_WILAYAH.get(l.wilayahId)?.provinsiId === efektif.provinsiId),
    [data, nasional, efektif.provinsiId],
  )
  const ag = useMemo(() => agregatWilayah(dalamProvinsi, kunci, INDEKS_WILAYAH), [dalamProvinsi, kunci])
  const nilai = useMemo(() => {
    const maks = Math.max(1, ...[...ag.values()].map((a) => a[metrik]))
    return new Map(
      [...ag.values()].map((a) => [a.id, { tinggi: a[metrik] / maks, rasio: a.terbuka ? a.lewatSla / a.terbuka : 0 }]),
    )
  }, [ag, metrik])

  // Tiang laporan terbuka untuk wilayah fokus (kab/kota).
  const titik = useMemo(() => {
    if (!fokus) return []
    const lap = k.saring(data).filter((l) => STATUS_TERBUKA.includes(l.status))
    const maks = Math.max(1, ...lap.map((l) => l.prioritas.skor))
    return lap.map((l) => ({ lat: l.lat, lng: l.lng, level: l.prioritas.level, tinggi: l.prioritas.skor / maks }))
    // k.saring berubah bila cakupan berubah, sudah tercakup oleh fokus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fokus, data])

  const bisaKlik = (id) => {
    if (akses.tingkat === TINGKAT.KABKOTA) return false
    if (nasional) return true
    return !fokus || id !== fokus
  }
  const pilih = (id) =>
    nasional
      ? setCakupan({ provinsiId: id, kabkotaId: null })
      : setCakupan({ provinsiId: efektif.provinsiId, kabkotaId: id })

  const nama = (id) => (nasional ? provinsiById(id)?.nama : kabkotaById(id)?.nama) ?? id
  const sorot = arah ?? fokus
  const statSorot = sorot ? (ag.get(sorot) ?? { total: 0, terbuka: 0, lewatSla: 0, persenTepat: null }) : null
  const total = [...(fokus ? [ag.get(fokus) ?? { total: 0, terbuka: 0, lewatSla: 0 }] : ag.values())].reduce(
    (s, a) => ({ total: s.total + a.total, terbuka: s.terbuka + a.terbuka, lewat: s.lewat + a.lewatSla }),
    { total: 0, terbuka: 0, lewat: 0 },
  )
  const teratas = [...ag.values()].sort((a, b) => b[metrik] - a[metrik]).slice(0, 6)
  const ilustrasi = nasional || efektif.provinsiId !== 'jawa-barat' || dalamProvinsi.some((l) => l.ilustrasi)

  return (
    <div>
      <JudulHalaman
        judul={
          nasional ? 'Peta 3D Indonesia' : fokus ? `Peta 3D ${kabkotaById(fokus)?.nama}` : `Peta 3D ${k.namaCakupan}`
        }
        ikon={nasional ? Globe2 : Box}
        sub="Tinggi balok = metrik terpilih, warna = porsi laporan terbuka yang lewat target waktu. Seret untuk memutar, gulir untuk zoom."
        kanan={
          <div className="flex rounded-xl bg-paper p-1" role="group" aria-label="Metrik tinggi">
            {METRIK.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetrik(m.id)}
                aria-pressed={metrik === m.id}
                className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${metrik === m.id ? 'bg-white text-brand-900 shadow' : 'text-ink-soft'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel padat className="overflow-hidden">
          <div className="relative h-[460px] bg-gradient-to-b from-[#f4faf8] to-[#e3efec] sm:h-[560px]">
            {galat ? (
              <p className="p-6 text-sm text-tinggi">Batas wilayah gagal dimuat ({galat.message}).</p>
            ) : !geo || loading ? (
              <div className="p-6">
                <Kerangka baris={4} />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="p-6">
                    <Kerangka baris={4} />
                  </div>
                }
              >
                <Peta3D
                  geo={geo}
                  nilai={nilai}
                  fokus={fokus}
                  titik={titik}
                  bisaKlik={bisaKlik}
                  onPilih={pilih}
                  onArah={setArah}
                  judulAria={`Peta 3D ${k.namaCakupan}: ${angka(total.terbuka)} laporan terbuka`}
                />
              </Suspense>
            )}

            {/* Legenda */}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-white/90 p-3 text-[11px] shadow ring-1 ring-line backdrop-blur">
              <p className="font-bold text-ink">Porsi lewat target</p>
              <div
                className="mt-1.5 h-2 w-40 rounded-full"
                style={{ background: 'linear-gradient(90deg,#2bb39a,#f5b83d,#e8590c)' }}
              />
              <div className="mt-1 flex justify-between text-ink-faint">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              {fokus && (
                <p className="mt-2 text-ink-soft">Tiang = laporan terbuka (warna level, tinggi skor prioritas)</p>
              )}
            </div>
            {akses.tingkat !== TINGKAT.KABKOTA && (
              <p className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-ink-soft shadow ring-1 ring-line">
                <MousePointerClick size={13} aria-hidden="true" />
                {nasional ? 'Klik provinsi untuk melihat kab/kota' : 'Klik kab/kota untuk fokus'}
              </p>
            )}
          </div>
          {ilustrasi && (
            <p className="flex items-start gap-2 border-t border-line bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Data ilustrasi: laporan di luar Bandung Raya adalah contoh untuk demo nasional, bukan laporan warga asli.
              Batas: geoBoundaries (BPS 2020, CC BY 3.0 IGO; OSM, ODbL).
            </p>
          )}
        </Panel>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
            <KartuAngka label="Total laporan" nilai={angka(total.total)} memuat={loading} />
            <KartuAngka label="Terbuka" nilai={angka(total.terbuka)} nada="waspada" memuat={loading} />
            <KartuAngka
              label="Lewat target"
              ikon={TimerOff}
              nilai={angka(total.lewat)}
              nada={total.lewat ? 'bahaya' : 'baik'}
              memuat={loading}
            />
          </div>

          <Panel judul={sorot ? nama(sorot) : 'Arahkan ke wilayah'} ikon={Layers}>
            {statSorot ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-faint">Total</dt>
                  <dd className="text-lg font-extrabold tabular-nums">{angka(statSorot.total)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Terbuka</dt>
                  <dd className="text-lg font-extrabold tabular-nums">{angka(statSorot.terbuka)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Lewat target</dt>
                  <dd className="text-lg font-extrabold tabular-nums text-tinggi">{angka(statSorot.lewatSla)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Klaim tepat waktu</dt>
                  <dd className="text-lg font-extrabold tabular-nums">
                    {statSorot.persenTepat == null ? '–' : `${statSorot.persenTepat}%`}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-ink-soft">Arahkan kursor ke balok untuk melihat angka wilayah itu.</p>
            )}
          </Panel>

          <Panel judul={`Tertinggi · ${METRIK.find((m) => m.id === metrik).label.toLowerCase()}`} ikon={TimerOff}>
            <ol className="space-y-2 text-sm">
              {teratas.map((a, i) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-ink-faint">{i + 1}</span>
                  <button
                    type="button"
                    disabled={!bisaKlik(a.id)}
                    onClick={() => pilih(a.id)}
                    className="min-w-0 flex-1 truncate text-left font-semibold enabled:hover:text-brand-700"
                  >
                    {nama(a.id)}
                  </button>
                  <span className="tabular-nums font-bold">{angka(a[metrik])}</span>
                </li>
              ))}
              {!teratas.length && <li className="text-ink-soft">Belum ada laporan di cakupan ini.</li>}
            </ol>
            {akses.tingkat !== TINGKAT.KABKOTA && (
              <Link to="/instansi/peringkat" className="mt-3 block text-xs font-semibold text-brand-700">
                Lihat peringkat lengkap →
              </Link>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
