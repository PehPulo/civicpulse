// Rencana kerja regu (admin kab/kota): menjadwalkan laporan terbuka ke regu lapangan per hari dengan
// rencanaKerja() & reguMinimal() (@civicpulse/core, diuji). EDF = tenggat target waktu paling dekat dulu.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Printer, TimerOff, Truck, Users } from 'lucide-react'
import { kategoriById, rencanaKerja, reguMinimal } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { lokasiPendek, wilayahById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { LencanaPrioritas } from '../../components/Prioritas.jsx'
import { HanyaUntuk, JudulHalaman, KartuAngka, Kerangka, Panel, PesanGalat } from '../../components/instansi/ui.jsx'
import KartuAi from '../../components/KartuAi.jsx'

const KUNCI = 'civicpulse:rencana-kerja'
function muatPengaturan() {
  try {
    return { regu: 3, kapasitas: 2, ...JSON.parse(localStorage.getItem(KUNCI) || '{}') }
  } catch {
    return { regu: 3, kapasitas: 2 }
  }
}
const tanggal = (iso) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })

function Angka({ id, label, nilai, ubah, min, maks, ket }) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => ubah(Math.max(min, nilai - 1))}
          className="h-10 w-10 rounded-xl ring-1 ring-line hover:bg-paper"
          aria-label={`Kurangi ${label}`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={maks}
          value={nilai}
          onChange={(e) => ubah(Math.max(min, Math.min(maks, Number(e.target.value) || min)))}
          className="h-10 w-16 rounded-xl border border-line text-center tabular-nums"
        />
        <button
          type="button"
          onClick={() => ubah(Math.min(maks, nilai + 1))}
          className="h-10 w-10 rounded-xl ring-1 ring-line hover:bg-paper"
          aria-label={`Tambah ${label}`}
        >
          +
        </button>
      </div>
      <span className="mt-1 block text-xs font-normal text-ink-faint">{ket}</span>
    </label>
  )
}

export default function RencanaKerja() {
  const k = useCakupan()
  const [atur, setAtur] = useState(muatPengaturan)
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])
  const simpan = (baru) => {
    const n = { ...atur, ...baru }
    setAtur(n)
    try {
      localStorage.setItem(KUNCI, JSON.stringify(n))
    } catch {
      // hanya di memori
    }
  }

  const semua = k.saring(data)
  const r = rencanaKerja(semua, atur)
  const minimal = reguMinimal(semua, { kapasitas: atur.kapasitas })
  const byKode = new Map(semua.map((l) => [l.kode, l]))
  const perHari = Map.groupBy ? Map.groupBy(r.tugas, (t) => t.hari) : kelompok(r.tugas)

  return (
    <HanyaUntuk boleh={k.menangani} pesan="Rencana kerja regu disusun oleh admin kab/kota yang menangani laporan.">
      <JudulHalaman
        judul={`Rencana kerja regu · ${k.namaCakupan}`}
        ikon={Truck}
        sub="Laporan terbuka dibagi ke regu lapangan. Tenggat terdekat dikerjakan dulu; bila tenggatnya sama, skor prioritas yang lebih tinggi didahulukan."
        kanan={
          <button type="button" onClick={() => window.print()} className="btn-ghost min-h-10 text-sm print:hidden">
            <Printer size={16} aria-hidden="true" /> Cetak surat tugas
          </button>
        }
      />
      <PesanGalat galat={error} />
      <div className="mb-5 rounded-2xl border border-line bg-white p-5 print:hidden">
        <KartuAi
          polos
          tugas="rekap"
          body={{
            provinsiId: k.efektif.provinsiId ?? undefined,
            kabkotaId: k.efektif.kabkotaId ?? undefined,
            regu: atur.regu,
            kapasitas: atur.kapasitas,
          }}
          judul="Narasi rencana kerja"
          sub="Ringkasan beban antrean, keterlambatan, dan kebutuhan regu sesuai kapasitas yang Anda atur."
          labelTombol="Tulis narasi"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <div className="space-y-4 print:hidden">
          <Panel judul="Kapasitas tim" ikon={Users}>
            <div className="space-y-4">
              <Angka
                id="jumlah-regu"
                label="Jumlah regu"
                nilai={r.regu}
                ubah={(v) => simpan({ regu: v })}
                min={1}
                maks={20}
                ket="Regu lapangan yang bisa diturunkan."
              />
              <Angka
                id="kapasitas-regu"
                label="Laporan per regu per hari"
                nilai={r.kapasitas}
                ubah={(v) => simpan({ kapasitas: v })}
                min={1}
                maks={10}
                ket="Rata-rata penanganan yang tuntas dalam sehari."
              />
            </div>
            {minimal != null && minimal !== r.regu && (
              <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
                <p>
                  Butuh minimal <b>{minimal} regu</b> agar tidak ada laporan baru yang terlambat.
                </p>
                <button
                  type="button"
                  onClick={() => simpan({ regu: minimal })}
                  className="mt-2 text-xs font-bold text-brand-700 hover:underline"
                >
                  Pakai {minimal} regu
                </button>
              </div>
            )}
          </Panel>
          <div className="grid grid-cols-2 gap-3">
            <KartuAngka label="Laporan dijadwalkan" nilai={r.total} memuat={loading} />
            <KartuAngka label="Hari kerja" ikon={CalendarDays} nilai={r.hari} satuan="hari" memuat={loading} />
            <KartuAngka
              label="Diperkirakan terlambat"
              ikon={TimerOff}
              nilai={r.terlambatBaru}
              nada={r.terlambatBaru ? 'bahaya' : 'baik'}
              ket="belum lewat, tapi tak terkejar"
              memuat={loading}
            />
            <KartuAngka
              label="Sudah lewat target"
              nilai={r.sudahLewat}
              nada={r.sudahLewat ? 'waspada' : 'baik'}
              ket="dijadwalkan paling awal"
              memuat={loading}
            />
          </div>
          <Panel judul="Beban per regu" ikon={Users}>
            <ul className="space-y-1.5 text-sm">
              {r.perRegu.map((n, i) => (
                <li key={i} className="flex justify-between">
                  <span>Regu {i + 1}</span>
                  <b className="tabular-nums">{n} laporan</b>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Panel>
              <Kerangka baris={6} />
            </Panel>
          ) : r.total === 0 ? (
            <Panel>
              <p className="text-sm text-ink-soft">Tidak ada laporan terbuka untuk dijadwalkan.</p>
            </Panel>
          ) : (
            [...perHari.entries()].map(([hari, tugas]) => (
              <Panel
                key={hari}
                judul={`Hari ${hari} · ${tanggal(tugas[0].rencanaSelesai)}`}
                ikon={CalendarDays}
                padat
                className="break-inside-avoid"
              >
                <table className="w-full text-sm">
                  <thead className="bg-paper text-left text-xs text-ink-soft">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Regu</th>
                      <th className="px-3 py-2 font-semibold">Laporan</th>
                      <th className="px-3 py-2 font-semibold">Prioritas</th>
                      <th className="px-4 py-2 text-right font-semibold">Tenggat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tugas.map((t) => {
                      const l = byKode.get(t.kode)
                      return (
                        <tr key={t.kode} className={t.terlambat ? 'bg-orange-50/60' : ''}>
                          <td className="px-4 py-2.5 font-bold">R{t.regu}</td>
                          <td className="px-3 py-2.5">
                            <Link to={`/instansi/laporan/${t.kode}`} className="font-semibold hover:text-brand-700">
                              {l.judul}
                            </Link>
                            <span className="block text-xs text-ink-faint">
                              {t.kode} · {lokasiPendek(wilayahById(l.wilayahId))} · {kategoriById(l.kategoriId)?.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right text-xs tabular-nums ${t.terlambat ? 'font-bold text-tinggi' : 'text-ink-soft'}`}
                          >
                            {tanggal(t.tenggat)}
                            {t.sudahLewat ? ' · sudah lewat' : t.terlambat ? ' · terlambat' : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Panel>
            ))
          )}
        </div>
      </div>
    </HanyaUntuk>
  )
}

function kelompok(tugas) {
  const m = new Map()
  for (const t of tugas) m.set(t.hari, [...(m.get(t.hari) ?? []), t])
  return m
}
