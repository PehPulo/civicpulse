// PEMILIK: Ezra · Peta kesenjangan per kecamatan (skorKesenjangan 0–100).
// Aturan dataviz: besaran ⇒ SATU hue terang→gelap (sequential), 4 kelas dengan legenda skala,
// plus tabel peringkat di sebelahnya (warna tidak pernah jadi satu-satunya pembawa informasi).
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { PUSAT_PETA, TILE_ATRIBUSI, TILE_URL } from '../../lib/peta.js'
import { KELAS_KESENJANGAN as KELAS, warnaKesenjangan } from '../../lib/kesenjangan.js'

/** @param {{ wilayah: object[], senyap: Set<string> }} props  wilayah = statistik().perWilayah */
export default function PetaKesenjangan({ wilayah, senyap }) {
  return (
    <div>
      <div className="h-80 overflow-hidden rounded-xl border border-line">
        <MapContainer center={PUSAT_PETA} zoom={10} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer attribution={TILE_ATRIBUSI} url={TILE_URL} />
          {wilayah.map((w) => (
            <CircleMarker
              key={w.wilayahId}
              center={[w.lat, w.lng]}
              radius={14}
              pathOptions={{
                color: senyap.has(w.wilayahId) ? '#0f1f2e' : '#ffffff',
                weight: senyap.has(w.wilayahId) ? 3 : 2,
                dashArray: senyap.has(w.wilayahId) ? '4 3' : undefined,
                fillColor: warnaKesenjangan(w.skorKesenjangan),
                fillOpacity: 0.9,
              }}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                Kec. {w.kecamatan}: {w.skorKesenjangan}
              </Tooltip>
              <Popup>
                <p className="font-semibold">
                  Kec. {w.kecamatan}, {w.kabupaten}
                </p>
                <p>Skor kesenjangan: {w.skorKesenjangan}/100</p>
                <p>
                  Risiko {w.risikoMaks}/100 · {w.terbuka} laporan terbuka · rata-rata {w.rataUmurTerbukaHari ?? 0} hari
                </p>
                {senyap.has(w.wilayahId) && (
                  <p className="font-semibold">Wilayah Senyap: laporannya jauh di bawah rata-rata</p>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
        <span className="font-semibold text-ink">Skor kesenjangan</span>
        <ul className="flex items-center gap-1" aria-label="Legenda skor kesenjangan">
          {KELAS.map((k) => (
            <li key={k.label} className="flex flex-col items-center">
              <span className="h-2.5 w-10 rounded-sm" style={{ background: k.warna }} aria-hidden="true" />
              <span className="mt-1 tabular-nums">{k.label}</span>
            </li>
          ))}
        </ul>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-dashed border-ink" aria-hidden="true" /> Wilayah Senyap
        </span>
      </div>
    </div>
  )
}
