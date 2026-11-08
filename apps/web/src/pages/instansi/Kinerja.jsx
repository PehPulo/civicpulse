// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § /instansi/kinerja
// Angka kinerja dihitung dari data warga (core analitik), bukan input instansi —
// supaya instansi melihat kinerjanya sendiri secara jujur.
import { useState } from 'react'
import { AlertTriangle, BadgeCheck, Inbox, RotateCcw, Timer } from 'lucide-react'
import { STATUS } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { DATA_ILUSTRASI } from '../../lib/peta.js'

// Warna skor kesenjangan mengikuti palet prioritas yang sama (components/Prioritas.jsx).
const levelKesenjangan = (skor) => (skor >= 70 ? 'Tinggi' : skor >= 40 ? 'Sedang' : 'Rendah')
const TEKS_LEVEL = { Tinggi: 'text-tinggi', Sedang: 'text-sedang', Rendah: 'text-rendah' }

const tampilWaktu = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

function KartuKpi({ ikon: Ikon, label, nilai, satuan, keterangan, warnaNilai = 'text-ink' }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
        <Ikon size={14} aria-hidden="true" /> {label}
      </p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums tracking-tight ${warnaNilai}`}>
        {nilai}
        {satuan && <span className="ml-1 text-base font-semibold text-ink-faint">{satuan}</span>}
      </p>
      <p className="mt-1 text-xs text-ink-faint">{keterangan}</p>
    </div>
  )
}

function LencanaSkor({ skor }) {
  return <span className={`font-bold tabular-nums ${TEKS_LEVEL[levelKesenjangan(skor)]}`}>{skor}</span>
}

export default function Kinerja() {
  const [ulang, setUlang] = useState(0)
  const { data: stat, loading, error } = useApi(() => api.statistik(), [ulang])

  const wilayah = [...(stat?.perWilayah ?? [])].sort((a, b) => b.skorKesenjangan - a.skorKesenjangan)

  return (
    <section aria-label="Kinerja instansi">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Kinerja Instansi</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">
            Cermin jujur penanganan laporan: seberapa cepat selesai, dan seberapa sering warga menyatakan hasilnya belum
            beres. Semua angka dihitung dari laporan dan verifikasi warga.
          </p>
        </div>
        {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
      </div>

      {error && (
        <div role="alert" className="card mt-4 border-tinggi bg-orange-50 p-4 text-sm text-tinggi">
          <p>{error.message}</p>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="btn-ghost mt-3 py-2">
            Coba lagi
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-5" aria-label="Memuat statistik kinerja">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse p-5 motion-reduce:animate-none">
                <div className="h-3 w-24 rounded bg-line" />
                <div className="mt-3 h-8 w-16 rounded bg-line" />
                <div className="mt-3 h-3 w-full rounded bg-line" />
              </div>
            ))}
          </div>
          <div className="card mt-5 animate-pulse p-5 motion-reduce:animate-none">
            <div className="h-4 w-40 rounded bg-line" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="mt-4 h-3 w-full rounded bg-line" />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && stat && (
        <>
          <p className="mt-4 text-xs text-ink-faint">Dihitung {tampilWaktu(stat.dihitung)}</p>

          {stat.total === 0 ? (
            <div className="card mt-3 p-8 text-center">
              <p className="font-semibold text-ink">Belum ada laporan yang masuk.</p>
              <p className="mt-2 text-sm text-ink-soft">
                Statistik kinerja muncul setelah warga mengirim laporan pertama.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KartuKpi
                  ikon={Timer}
                  label="Median waktu tangani"
                  nilai={stat.medianHariTangani ?? '–'}
                  satuan={stat.medianHariTangani != null ? 'hari' : undefined}
                  keterangan={
                    stat.medianHariTangani != null
                      ? 'Lapor sampai terverifikasi warga'
                      : 'Belum ada laporan terverifikasi'
                  }
                />
                <KartuKpi
                  ikon={BadgeCheck}
                  label="Terverifikasi warga"
                  nilai={`${stat.persenTerverifikasi}%`}
                  keterangan='Dari laporan yang pernah diklaim "selesai"'
                  warnaNilai={stat.persenTerverifikasi >= 70 ? 'text-rendah' : 'text-ink'}
                />
                <KartuKpi
                  ikon={RotateCcw}
                  label="Dibuka ulang"
                  nilai={stat.perStatus[STATUS.DIBUKA_ULANG] ?? 0}
                  keterangan="Warga menyatakan hasil belum beres"
                  warnaNilai={stat.perStatus[STATUS.DIBUKA_ULANG] > 0 ? 'text-tinggi' : 'text-ink'}
                />
                <KartuKpi
                  ikon={Inbox}
                  label="Total laporan"
                  nilai={stat.total}
                  keterangan={`${stat.perStatus[STATUS.TERVERIFIKASI] ?? 0} terverifikasi · ${
                    stat.perStatus[STATUS.KLAIM_SELESAI] ?? 0
                  } menunggu verifikasi`}
                />
              </div>

              <div className="card mt-5 p-4 sm:p-5">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                  <AlertTriangle size={16} className="text-sedang" aria-hidden="true" />
                  Perlu perhatian
                </h2>
                <p className="mt-1 text-xs text-ink-faint">
                  Wilayah dengan skor kesenjangan tertinggi: gabungan risiko, tumpukan laporan terbuka, dan lamanya
                  penanganan.
                </p>
                {stat.perluPerhatian.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-soft">Tidak ada wilayah yang perlu perhatian khusus.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {stat.perluPerhatian.map((w, i) => (
                      <li
                        key={w.wilayahId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-sm font-bold tabular-nums text-ink-faint" aria-hidden="true">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">Kec. {w.kecamatan}</p>
                            <p className="text-xs text-ink-faint">
                              {w.terbuka} terbuka · rata-rata umur {w.rataUmurTerbukaHari} hari · risiko {w.risikoMaks}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-ink-soft">
                          Skor <LencanaSkor skor={w.skorKesenjangan} />
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="card mt-5 overflow-x-auto">
                <div className="flex flex-wrap items-baseline justify-between gap-2 p-4 pb-0 sm:p-5 sm:pb-0">
                  <h2 className="text-base font-bold text-ink">Per wilayah</h2>
                  <p className="text-xs text-ink-faint">Diurutkan dari skor kesenjangan tertinggi</p>
                </div>
                <table className="mt-3 w-full text-sm">
                  <caption className="sr-only">
                    Ringkasan laporan per kecamatan, diurutkan dari skor kesenjangan tertinggi
                  </caption>
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-faint">
                      <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">
                        Kecamatan
                      </th>
                      <th scope="col" className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">
                        Total
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                        Terbuka
                      </th>
                      <th scope="col" className="hidden px-3 py-2.5 text-right font-semibold md:table-cell">
                        Rata umur terbuka
                      </th>
                      <th scope="col" className="hidden px-3 py-2.5 text-right font-semibold lg:table-cell">
                        30 hari
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold sm:px-5">
                        Skor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {wilayah.map((w) => (
                      <tr key={w.wilayahId} className="border-b border-line last:border-0">
                        <th scope="row" className="px-4 py-3 text-left font-semibold text-ink sm:px-5">
                          {w.kecamatan}
                          <span className="block text-xs font-normal text-ink-faint">{w.kabupaten}</span>
                        </th>
                        <td className="hidden px-3 py-3 text-right tabular-nums text-ink-soft sm:table-cell">
                          {w.total}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{w.terbuka}</td>
                        <td className="hidden px-3 py-3 text-right tabular-nums text-ink-soft md:table-cell">
                          {w.rataUmurTerbukaHari} hari
                        </td>
                        <td className="hidden px-3 py-3 text-right tabular-nums text-ink-soft lg:table-cell">
                          {w.laporan30h}
                        </td>
                        <td className="px-4 py-3 text-right sm:px-5">
                          <LencanaSkor skor={w.skorKesenjangan} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-ink-faint">
                Status <span className="font-semibold">Terverifikasi</span> hanya diberikan sistem setelah warga
                mengonfirmasi hasil perbaikan — instansi tidak bisa menandainya sendiri.
              </p>
            </>
          )}
        </>
      )}
    </section>
  )
}
