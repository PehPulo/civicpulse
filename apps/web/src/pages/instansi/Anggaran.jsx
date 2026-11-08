// Estimasi / kebutuhan anggaran penanganan laporan terbuka: estimasiAnggaran() (@civicpulse/core, diuji).
// Biaya satuan = ASUMSI yang bisa diubah petugas (ganti dengan HSPK daerah); disimpan di peramban ini saja.
// Kab/kota: per kategori. Provinsi/pusat: per kategori + rincian per kab/kota atau per provinsi.
import { useMemo, useState } from 'react'
import { Download, Info, RotateCcw, Wallet } from 'lucide-react'
import { BIAYA_SATUAN_ASUMSI, KATEGORI, TINGKAT, estimasiAnggaran, lokasiLaporan } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { INDEKS_WILAYAH, kabkotaById, provinsiById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { Batang, JudulHalaman, Kerangka, Panel, PesanGalat } from '../../components/instansi/ui.jsx'

const KUNCI = 'civicpulse:biaya-satuan'
const rupiah = (n) => `Rp${Math.round(n).toLocaleString('id-ID')}`
const ringkasRp = (n) =>
  n >= 1e12
    ? `Rp${(n / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 2 })} T`
    : n >= 1e9
      ? `Rp${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
      : `Rp${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`

function muatBiaya() {
  try {
    return { ...BIAYA_SATUAN_ASUMSI, ...JSON.parse(localStorage.getItem(KUNCI) || '{}') }
  } catch {
    return { ...BIAYA_SATUAN_ASUMSI }
  }
}

export default function Anggaran() {
  const k = useCakupan()
  const { efektif } = k
  const [biaya, setBiaya] = useState(muatBiaya)
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])
  const ubah = (id, nilai) => {
    const n = { ...biaya, [id]: Math.max(0, Number(String(nilai).replace(/\D/g, '')) || 0) }
    setBiaya(n)
    try {
      localStorage.setItem(KUNCI, JSON.stringify(n))
    } catch {
      // hanya di memori
    }
  }
  const pulihkan = () => {
    setBiaya({ ...BIAYA_SATUAN_ASUMSI })
    try {
      localStorage.removeItem(KUNCI)
    } catch {
      // abaikan
    }
  }

  const semua = k.saring(data)
  const e = estimasiAnggaran(semua, biaya)
  const nasional = efektif.tingkat === TINGKAT.PUSAT
  const rinci = efektif.tingkat !== TINGKAT.KABKOTA
  const kunci = nasional ? 'provinsiId' : 'kabkotaId'
  const perWilayah = useMemo(() => {
    if (!rinci) return []
    const grup = new Map()
    for (const l of semua) {
      const id = lokasiLaporan(l, INDEKS_WILAYAH)[kunci]
      if (id) grup.set(id, [...(grup.get(id) ?? []), l])
    }
    return [...grup.entries()]
      .map(([id, ls]) => ({ id, ...estimasiAnggaran(ls, biaya) }))
      .filter((x) => x.jumlah)
      .sort((a, b) => b.total - a.total)
  }, [semua, biaya, kunci, rinci])
  const maks = Math.max(1, ...perWilayah.map((x) => x.total))
  const nama = (id) => (nasional ? provinsiById(id) : kabkotaById(id))?.nama ?? id

  const unduh = () => {
    const baris = [
      ['Kategori', 'Laporan terbuka', 'Biaya satuan (asumsi)', 'Subtotal'],
      ...e.baris.map((b) => [KATEGORI.find((x) => x.id === b.kategoriId)?.label, b.jumlah, b.biayaSatuan, b.subtotal]),
      ['Total', e.jumlah, '', e.total],
      [],
      [nasional ? 'Provinsi' : 'Kab/kota', 'Laporan terbuka', '', 'Estimasi'],
      ...perWilayah.map((x) => [nama(x.id), x.jumlah, '', x.total]),
    ]
    const csv = baris.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'estimasi-anggaran-civicpulse.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <JudulHalaman
        judul={`${k.menangani ? 'Estimasi anggaran' : 'Kebutuhan anggaran'} · ${k.namaCakupan}`}
        ikon={Wallet}
        sub="Estimasi = jumlah laporan terbuka per kategori × biaya satuan. Ubah biaya satuan sesuai HSPK daerah Anda."
        kanan={
          <button type="button" onClick={unduh} className="btn-ghost min-h-10 text-sm" disabled={!data}>
            <Download size={16} aria-hidden="true" /> Unduh CSV
          </button>
        }
      />
      <PesanGalat galat={error} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4 sm:col-span-2">
          <p className="text-xs font-semibold text-ink-soft">Estimasi total penanganan</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand-900">{rupiah(e.total)}</p>
          <p className="mt-1 text-xs text-ink-faint">untuk {e.jumlah} laporan terbuka</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold text-ink-soft">Rata-rata per laporan</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{ringkasRp(e.jumlah ? e.total / e.jumlah : 0)}</p>
        </div>
      </div>

      <div className={`grid gap-5 ${rinci ? 'xl:grid-cols-2' : ''}`}>
        <Panel
          judul="Per kategori"
          ikon={Wallet}
          padat
          kanan={
            <button
              type="button"
              onClick={pulihkan}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700"
            >
              <RotateCcw size={12} aria-hidden="true" /> Pulihkan asumsi
            </button>
          }
        >
          {loading ? (
            <div className="p-5">
              <Kerangka />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Kategori</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Terbuka</th>
                  <th className="px-3 py-2.5 font-semibold">Biaya satuan (Rp)</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {e.baris.map((b) => {
                  const kat = KATEGORI.find((x) => x.id === b.kategoriId)
                  return (
                    <tr key={b.kategoriId}>
                      <td className="px-4 py-2.5 font-semibold">{kat?.label}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{b.jumlah}</td>
                      <td className="px-3 py-2">
                        <input
                          inputMode="numeric"
                          value={b.biayaSatuan.toLocaleString('id-ID')}
                          onChange={(ev) => ubah(b.kategoriId, ev.target.value)}
                          aria-label={`Biaya satuan ${kat?.label}`}
                          className="h-9 w-36 rounded-lg border border-line px-2 text-right tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{ringkasRp(b.subtotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-paper font-extrabold">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{e.jumlah}</td>
                  <td />
                  <td className="px-4 py-2.5 text-right tabular-nums">{ringkasRp(e.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          <p className="flex items-start gap-2 border-t border-line bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Biaya satuan bawaan adalah asumsi simulasi, bukan HSPK resmi. Perubahan tersimpan di peramban ini saja.
          </p>
        </Panel>

        {rinci && (
          <Panel judul={`Per ${nasional ? 'provinsi' : 'kab/kota'} (${perWilayah.length})`} ikon={Wallet}>
            {loading ? (
              <Kerangka />
            ) : perWilayah.length === 0 ? (
              <p className="text-sm text-ink-soft">Tidak ada laporan terbuka.</p>
            ) : (
              <ul className="space-y-3">
                {perWilayah.slice(0, 15).map((x) => (
                  <li key={x.id}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-semibold">{nama(x.id)}</span>
                      <span className="shrink-0 tabular-nums">
                        <b>{ringkasRp(x.total)}</b> <span className="text-xs text-ink-faint">· {x.jumlah} lap.</span>
                      </span>
                    </div>
                    <div className="mt-1">
                      <Batang nilai={(x.total / maks) * 100} label={`Estimasi ${nama(x.id)}`} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  )
}
