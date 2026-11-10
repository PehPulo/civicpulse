// Rekap & cetak (semua tingkat): laporan berkala siap cetak/PDF untuk rapat dinas, dihitung dari statistik(),
// kepatuhanSla() & estimasiAnggaran() (@civicpulse/core) pada cakupan aktif dan periode terpilih.
import { useMemo, useState } from 'react'
import { FileBarChart, Printer } from 'lucide-react'
import {
  KATEGORI,
  LABEL_STATUS,
  STATUS,
  STATUS_TERBUKA,
  TINGKAT,
  estimasiAnggaran,
  kepatuhanSla,
  statistik as hitungStatistik,
} from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { WILAYAH, lokasiPendek, wilayahById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { JudulHalaman, Kerangka, PesanGalat } from '../../components/instansi/ui.jsx'
import KartuAi from '../../components/KartuAi.jsx'

const PERIODE = [
  { id: 7, label: '7 hari' },
  { id: 30, label: '30 hari' },
  { id: 90, label: '90 hari' },
  { id: 0, label: 'Semua' },
]
const tgl = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

function Sel({ children, kanan, tebal }) {
  return (
    <td
      className={`border border-line px-3 py-1.5 ${kanan ? 'text-right tabular-nums' : ''} ${tebal ? 'font-bold' : ''}`}
    >
      {children}
    </td>
  )
}

export default function Rekap() {
  const k = useCakupan()
  const { efektif } = k
  const [hari, setHari] = useState(30)
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])
  const sekarang = new Date()

  const r = useMemo(() => {
    if (!data) return null
    const batas = hari ? Date.now() - hari * 86_400_000 : 0
    const lap = k.saring(data).filter((l) => Date.parse(l.dibuat) >= batas)
    const wilayah = WILAYAH.filter(
      (w) =>
        efektif.tingkat === TINGKAT.PUSAT ||
        (efektif.tingkat === TINGKAT.PROVINSI
          ? w.provinsiId === efektif.provinsiId
          : w.kabkotaId === efektif.kabkotaId),
    )
    return {
      lap,
      stat: hitungStatistik(lap, wilayah),
      sla: kepatuhanSla(lap),
      anggaran: estimasiAnggaran(lap),
      perKategori: KATEGORI.map((kat) => {
        const ls = lap.filter((l) => l.kategoriId === kat.id)
        return {
          label: kat.label,
          total: ls.length,
          terbuka: ls.filter((l) => STATUS_TERBUKA.includes(l.status)).length,
          selesai: ls.filter((l) => l.status === STATUS.TERVERIFIKASI).length,
        }
      }),
    }
  }, [data, hari, k, efektif])

  const awal = hari ? new Date(Date.now() - hari * 86_400_000) : null
  const sesi = api.sesiInstansi()

  return (
    <div>
      <div className="print:hidden">
        <JudulHalaman
          judul={`Rekap & cetak · ${k.namaCakupan}`}
          ikon={FileBarChart}
          sub="Laporan berkala untuk rapat dinas. Bisa dicetak atau disimpan sebagai PDF."
          kanan={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-white p-1 ring-1 ring-line" role="group" aria-label="Periode">
                {PERIODE.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setHari(p.id)}
                    aria-pressed={hari === p.id}
                    className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${hari === p.id ? 'bg-brand-600 text-white' : 'text-ink-soft'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => window.print()} className="btn-primary min-h-10 text-sm">
                <Printer size={16} aria-hidden="true" /> Cetak / PDF
              </button>
            </div>
          }
        />
      </div>
      <PesanGalat galat={error} />
      <div className="mb-5 rounded-2xl border border-line bg-white p-5 print:border-0 print:p-0">
        <KartuAi
          polos
          key={`${k.namaCakupan}-${hari}`}
          tugas="rekap"
          body={{ provinsiId: efektif.provinsiId ?? undefined, kabkotaId: efektif.kabkotaId ?? undefined, hari }}
          judul="Narasi laporan berkala"
          sub="Paragraf formal dari angka rekap di bawah, untuk disalin ke dokumen dinas."
          labelTombol="Tulis narasi"
        />
      </div>

      <article className="mx-auto max-w-[860px] rounded-2xl border border-line bg-white p-8 text-sm text-ink print:max-w-none print:rounded-none print:border-0 print:p-0">
        {loading || !r ? (
          <Kerangka baris={8} />
        ) : (
          <>
            <header className="border-b-2 border-ink pb-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">Rekapitulasi Laporan Warga</p>
              <h2 className="mt-1 text-xl font-extrabold">{k.namaCakupan}</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Periode {awal ? `${tgl(awal)} – ${tgl(sekarang)}` : `s.d. ${tgl(sekarang)}`} · {k.labelTingkat}
              </p>
            </header>

            <h3 className="mt-6 font-bold">A. Ringkasan</h3>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                <tr>
                  <Sel>Laporan masuk</Sel>
                  <Sel kanan tebal>
                    {r.stat.total}
                  </Sel>
                  <Sel>Median hari penanganan</Sel>
                  <Sel kanan tebal>
                    {r.stat.medianHariTangani ?? '–'}
                  </Sel>
                </tr>
                <tr>
                  <Sel>Masih terbuka</Sel>
                  <Sel kanan tebal>
                    {r.lap.filter((l) => STATUS_TERBUKA.includes(l.status)).length}
                  </Sel>
                  <Sel>Klaim diverifikasi warga</Sel>
                  <Sel kanan tebal>
                    {r.stat.persenTerverifikasi}%
                  </Sel>
                </tr>
                <tr>
                  <Sel>Klaim tepat target waktu</Sel>
                  <Sel kanan tebal>
                    {r.sla.persen}% ({r.sla.tepat}/{r.sla.dinilai})
                  </Sel>
                  <Sel>Estimasi anggaran (asumsi)</Sel>
                  <Sel kanan tebal>
                    Rp{r.anggaran.total.toLocaleString('id-ID')}
                  </Sel>
                </tr>
              </tbody>
            </table>

            <h3 className="mt-6 font-bold">B. Per status</h3>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                <tr>
                  {Object.values(STATUS).map((s) => (
                    <Sel key={s}>{LABEL_STATUS[s]}</Sel>
                  ))}
                </tr>
                <tr>
                  {Object.values(STATUS).map((s) => (
                    <Sel key={s} kanan tebal>
                      {r.stat.perStatus[s] ?? 0}
                    </Sel>
                  ))}
                </tr>
              </tbody>
            </table>

            <h3 className="mt-6 font-bold">C. Per kategori</h3>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr className="bg-paper text-left text-xs">
                  <Sel tebal>Kategori</Sel>
                  <Sel tebal kanan>
                    Masuk
                  </Sel>
                  <Sel tebal kanan>
                    Terbuka
                  </Sel>
                  <Sel tebal kanan>
                    Terverifikasi
                  </Sel>
                </tr>
              </thead>
              <tbody>
                {r.perKategori.map((b) => (
                  <tr key={b.label}>
                    <Sel>{b.label}</Sel>
                    <Sel kanan>{b.total}</Sel>
                    <Sel kanan>{b.terbuka}</Sel>
                    <Sel kanan>{b.selesai}</Sel>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-6 font-bold">D. Wilayah perlu perhatian</h3>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr className="bg-paper text-left text-xs">
                  <Sel tebal>Wilayah</Sel>
                  <Sel tebal kanan>
                    Terbuka
                  </Sel>
                  <Sel tebal kanan>
                    Rata umur terbuka (hari)
                  </Sel>
                  <Sel tebal kanan>
                    Skor kesenjangan
                  </Sel>
                </tr>
              </thead>
              <tbody>
                {r.stat.perluPerhatian.map((w) => (
                  <tr key={w.wilayahId}>
                    <Sel>{lokasiPendek(wilayahById(w.wilayahId) ?? w)}</Sel>
                    <Sel kanan>{w.terbuka}</Sel>
                    <Sel kanan>{w.rataUmurTerbukaHari}</Sel>
                    <Sel kanan>{w.skorKesenjangan}</Sel>
                  </tr>
                ))}
                {r.stat.perluPerhatian.length === 0 && (
                  <tr>
                    <Sel>Tidak ada wilayah yang perlu perhatian khusus.</Sel>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="mt-10 grid grid-cols-2 gap-6 text-xs text-ink-soft">
              <p>
                Dicetak {sekarang.toLocaleString('id-ID')} dari CivicPulse. Data di luar Bandung Raya bersifat
                ilustrasi.
              </p>
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="mt-14 border-t border-ink pt-1 font-semibold text-ink">{sesi?.petugas ?? 'Petugas'}</p>
                <p>{sesi?.jabatan || k.labelTingkat}</p>
              </div>
            </footer>
          </>
        )}
      </article>
    </div>
  )
}
