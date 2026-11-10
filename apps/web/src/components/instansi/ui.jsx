// PEMILIK: Yance (sisi instansi) · desain ulang panel: Ezra
// Komponen kecil yang dipakai bersama semua halaman panel instansi.
import { CheckCircle2, ClipboardCheck, Clock, Inbox, LayoutGrid, RotateCcw, Cpu, TimerOff, Wrench } from 'lucide-react'
import { STATUS } from '@civicpulse/core'

export const IKON_STATUS = {
  [STATUS.DITERIMA]: Inbox,
  [STATUS.DIPROSES]: Wrench,
  [STATUS.KLAIM_SELESAI]: ClipboardCheck,
  [STATUS.TERVERIFIKASI]: CheckCircle2,
  [STATUS.DIBUKA_ULANG]: RotateCcw,
}

export const WARNA_STATUS = {
  [STATUS.DITERIMA]: 'bg-slate-100 text-slate-700',
  [STATUS.DIPROSES]: 'bg-sky-50 text-sky-800',
  [STATUS.KLAIM_SELESAI]: 'bg-amber-50 text-amber-800',
  [STATUS.TERVERIFIKASI]: 'bg-green-50 text-green-800',
  [STATUS.DIBUKA_ULANG]: 'bg-orange-50 text-orange-800',
}

export const WARNA_LEVEL_HEX = { Tinggi: '#c2410c', Sedang: '#b7791f', Rendah: '#3f7d4e' }

export const tampilWaktu = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
export const persen = (x) => `${Math.round(x * 100)}%`
export const angka = (n) => Number(n ?? 0).toLocaleString('id-ID')
const hr = (x) => String(x).replace('.', ',')

/** Kepala halaman admin: kotak ikon, judul, deskripsi, dan tombol aksi di kanan. */
export function JudulHalaman({ judul, sub, kanan, ikon: Ikon = LayoutGrid }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 sm:flex print:hidden">
          <Ikon size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{judul}</h1>
          {sub && <p className="mt-1 max-w-3xl text-sm text-ink-soft">{sub}</p>}
        </div>
      </div>
      {kanan && <div className="flex flex-wrap items-center gap-2 print:hidden">{kanan}</div>}
    </div>
  )
}

export function Panel({ judul, ikon: Ikon, kanan, children, className = '', padat = false }) {
  return (
    <section
      data-muncul
      className={`rounded-2xl border border-line/70 bg-white shadow-[0_2px_10px_-4px_rgba(15,31,46,0.12)] ${className}`}
    >
      {judul && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-bold text-brand-700">
            {Ikon && <Ikon size={17} className="shrink-0 text-brand-600" aria-hidden="true" />}
            <span className="truncate">{judul}</span>
          </h2>
          {kanan}
        </header>
      )}
      <div className={padat ? '' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  )
}

/** Kartu angka. nada: 'netral' | 'bahaya' | 'waspada' | 'baik' */
export function KartuAngka({ label, nilai, satuan, ket, ikon: Ikon, nada = 'netral', memuat = false }) {
  const warna = {
    netral: 'text-ink',
    bahaya: 'text-tinggi',
    waspada: 'text-sedang',
    baik: 'text-rendah',
  }[nada]
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
        {Ikon && <Ikon size={14} aria-hidden="true" />} {label}
      </p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums tracking-tight ${warna}`}>
        {memuat ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-line" /> : nilai}
        {satuan && !memuat && <span className="ml-1 text-sm font-semibold text-ink-faint">{satuan}</span>}
      </p>
      {ket && <p className="mt-1 text-xs text-ink-faint">{ket}</p>}
    </div>
  )
}

/** Batang horizontal 0–100. */
export function Batang({ nilai, warna = 'bg-brand-500', tinggi = 'h-2', label }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-paper ${tinggi}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(nilai)}
      aria-label={label}
    >
      <div className={`${tinggi} rounded-full ${warna}`} style={{ width: `${Math.max(0, Math.min(100, nilai))}%` }} />
    </div>
  )
}

export function LencanaStatus({ status, label }) {
  const Ikon = IKON_STATUS[status]
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${WARNA_STATUS[status]}`}
    >
      {Ikon && <Ikon size={13} aria-hidden="true" />} {label}
    </span>
  )
}

/** Target waktu: "sisa 2 hari", "lewat 3 hari", atau "selesai dalam 4 hari". */
export function ChipSla({ sla }) {
  if (sla.selesai)
    return (
      <span
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${sla.lewat ? 'bg-orange-50 text-tinggi' : 'bg-green-50 text-rendah'}`}
      >
        <Clock size={13} aria-hidden="true" /> diklaim dalam {hr(sla.umurHari)} hr
      </span>
    )
  if (sla.lewat)
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-tinggi px-2.5 py-1 text-xs font-bold text-white">
        <TimerOff size={13} aria-hidden="true" /> lewat {hr(Math.abs(sla.sisaHari))} hr
      </span>
    )
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${sla.mendekati ? 'bg-amber-100 text-amber-900' : 'bg-paper text-ink-soft'}`}
    >
      <Clock size={13} aria-hidden="true" /> sisa {hr(sla.sisaHari)} hr
    </span>
  )
}

/** Penanda bahwa sebuah teks/angka berasal dari AI, lengkap dengan model & sumbernya. */
export function LencanaAi({ children = 'AI', judul }) {
  return (
    <span
      title={judul}
      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-800 ring-1 ring-brand-100"
    >
      <Cpu size={12} aria-hidden="true" /> {children}
    </span>
  )
}

export function Kerangka({ baris = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: baris }, (_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-line motion-reduce:animate-none"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  )
}

export function PesanGalat({ galat, ulang }) {
  if (!galat) return null
  return (
    <div role="alert" className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-tinggi">
      <p>{galat.message ?? String(galat)}</p>
      {ulang && (
        <button type="button" onClick={ulang} className="btn-ghost mt-3 py-2">
          Coba lagi
        </button>
      )}
    </div>
  )
}

/** Halaman khusus tingkat tertentu: tampilkan penjelasan bila dibuka tingkat lain (tautan langsung / bookmark). */
export function HanyaUntuk({ boleh, pesan, children }) {
  if (boleh) return children
  return (
    <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-soft">
      <p className="font-bold text-ink">Fitur ini bukan untuk tingkat admin Anda.</p>
      <p className="mt-1">{pesan}</p>
    </div>
  )
}
