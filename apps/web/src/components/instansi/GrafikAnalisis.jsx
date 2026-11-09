// PEMILIK: Ezra · Grafik & analisis di Ringkasan panel instansi (kab/kota, provinsi, pusat).
// Angka & kalimat dari analisisGrafik() (@civicpulse/core, diuji) — tanpa AI. Grafik SVG/HTML buatan sendiri:
// palet kategori tervalidasi buta warna (biru #2a78d6, oranye #eb6834, ...), legenda + label langsung,
// tooltip saat disorot, dan tabel untuk setiap grafik (aksesibilitas & cetak).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Info,
  Lightbulb,
  ListChecks,
  PieChart,
  TrendingUp,
  TriangleAlert,
  Trophy,
} from 'lucide-react'
import { LABEL_STATUS, TINGKAT } from '@civicpulse/core'
import { Kerangka, Panel, angka } from './ui.jsx'

// Palet kategori (urutan tetap). Slot 3–5 kontras < 3:1 ⇒ selalu disertai label angka & tabel.
const SERI = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const WARNA_SELESAI = SERI[0]
const WARNA_BELUM = SERI[1]
const tglPendek = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

function TabelData({ kolom, baris }) {
  return (
    <details className="mt-3 text-xs print:hidden">
      <summary className="cursor-pointer font-semibold text-ink-soft hover:text-ink">Lihat tabel</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <thead>
            <tr className="border-b border-line text-ink-faint">
              {kolom.map((k) => (
                <th key={k} className="py-1.5 pr-3 font-semibold">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b, i) => (
              <tr key={i} className="border-b border-line/60 text-ink">
                {b.map((sel, j) => (
                  <td key={j} className="py-1.5 pr-3">
                    {sel}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

function Legenda({ item }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
      {item.map(({ label, warna, nilai }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: warna }} aria-hidden="true" />
          {label}
          {nilai != null && <b className="tabular-nums text-ink">{nilai}</b>}
        </li>
      ))}
    </ul>
  )
}

/** Kolom bertumpuk per minggu: selesai (bawah) + belum selesai (atas). */
function GrafikTren({ mingguan }) {
  const [sorot, setSorot] = useState(null)
  const L = 640
  const T = 220
  const kiri = 34
  const bawah = 26
  const atas = 14
  const tinggiPlot = T - bawah - atas
  const maks = Math.max(1, ...mingguan.map((m) => m.masuk))
  const langkah = Math.max(1, Math.ceil(maks / 4 / 5) * 5)
  const plafon = langkah * Math.ceil(maks / langkah)
  const lebarSlot = (L - kiri) / mingguan.length
  const lebarBatang = Math.min(30, lebarSlot * 0.62)
  const y = (v) => atas + tinggiPlot - (v / plafon) * tinggiPlot
  const puncak = mingguan.reduce((iMaks, m, i) => (m.masuk > mingguan[iMaks].masuk ? i : iMaks), 0)
  const m = sorot != null ? mingguan[sorot] : null

  return (
    <div>
      <Legenda
        item={[
          { label: 'Selesai (diverifikasi warga)', warna: WARNA_SELESAI },
          { label: 'Belum selesai', warna: WARNA_BELUM },
        ]}
      />
      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${L} ${T}`}
          className="h-auto w-full"
          role="img"
          aria-label="Laporan masuk per minggu, 12 minggu terakhir"
        >
          {Array.from({ length: plafon / langkah + 1 }, (_, i) => i * langkah).map((v) => (
            <g key={v}>
              <line x1={kiri} x2={L} y1={y(v)} y2={y(v)} stroke="#e1e6e3" strokeWidth="1" />
              <text x={kiri - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8494a5">
                {v}
              </text>
            </g>
          ))}
          {mingguan.map((w, i) => {
            const x = kiri + i * lebarSlot + (lebarSlot - lebarBatang) / 2
            const hSelesai = y(0) - y(w.selesai)
            const hBelum = y(0) - y(w.belum)
            const celah = w.selesai && w.belum ? 2 : 0
            return (
              <g key={w.mulai} opacity={sorot == null || sorot === i ? 1 : 0.45}>
                {w.selesai > 0 && (
                  <rect x={x} y={y(w.selesai)} width={lebarBatang} height={hSelesai} rx="3" fill={WARNA_SELESAI} />
                )}
                {w.belum > 0 && (
                  <rect
                    x={x}
                    y={y(w.selesai) - hBelum - celah}
                    width={lebarBatang}
                    height={Math.max(0, hBelum)}
                    rx="3"
                    fill={WARNA_BELUM}
                  />
                )}
                {i === puncak && w.masuk > 0 && (
                  <text
                    x={x + lebarBatang / 2}
                    y={y(w.masuk) - 6 - celah}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#0f1f2e"
                  >
                    {w.masuk}
                  </text>
                )}
                {(i % 2 === 1 || mingguan.length <= 6) && (
                  <text x={x + lebarBatang / 2} y={T - 8} textAnchor="middle" fontSize="11" fill="#8494a5">
                    {tglPendek(w.mulai)}
                  </text>
                )}
                {/* area sorot lebih besar dari batang */}
                <rect
                  x={kiri + i * lebarSlot}
                  y={atas}
                  width={lebarSlot}
                  height={tinggiPlot}
                  fill="transparent"
                  onMouseEnter={() => setSorot(i)}
                  onMouseLeave={() => setSorot(null)}
                  onFocus={() => setSorot(i)}
                  onBlur={() => setSorot(null)}
                  tabIndex={0}
                  aria-label={`Minggu mulai ${tglPendek(w.mulai)}: ${w.masuk} masuk, ${w.selesai} selesai, ${w.belum} belum`}
                />
              </g>
            )
          })}
        </svg>
        {m && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: `${((kiri + (sorot + 0.5) * lebarSlot) / L) * 100}%` }}
          >
            <p className="font-bold text-ink">Minggu {tglPendek(m.mulai)}</p>
            <p className="mt-1 flex justify-between text-ink-soft">
              Masuk <b className="tabular-nums text-ink">{m.masuk}</b>
            </p>
            <p className="flex items-center justify-between text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: WARNA_SELESAI }} /> Selesai
              </span>
              <b className="tabular-nums text-ink">{m.selesai}</b>
            </p>
            <p className="flex items-center justify-between text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: WARNA_BELUM }} /> Belum
              </span>
              <b className="tabular-nums text-ink">{m.belum}</b>
            </p>
          </div>
        )}
      </div>
      <TabelData
        kolom={['Minggu mulai', 'Masuk', 'Selesai', 'Belum selesai']}
        baris={mingguan.map((w) => [tglPendek(w.mulai), w.masuk, w.selesai, w.belum])}
      />
    </div>
  )
}

/** Batang horizontal satu warna dengan label angka di ujung. */
function BatangHorizontal({ data, nilai, label, ket, maks, warna = SERI[0], satuan = '' }) {
  const atas = Math.max(1, maks ?? Math.max(...data.map(nilai)))
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.id ?? label(d)} title={`${label(d)}: ${nilai(d)}${satuan}`}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-semibold text-ink">{label(d)}</span>
            <span className="shrink-0 text-xs tabular-nums text-ink-soft">{ket(d)}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (nilai(d) / atas) * 100)}%`, background: warna }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function GrafikStatus({ status, total }) {
  const isi = status.filter((s) => s.jumlah > 0)
  return (
    <div>
      <div
        className="flex h-5 gap-0.5 overflow-hidden rounded-md"
        role="img"
        aria-label={isi.map((s) => `${LABEL_STATUS[s.status]} ${s.jumlah}`).join(', ')}
      >
        {status.map((s, i) =>
          s.jumlah ? (
            <div
              key={s.status}
              title={`${LABEL_STATUS[s.status]}: ${s.jumlah} (${Math.round((s.jumlah / total) * 100)}%)`}
              style={{ width: `${(s.jumlah / total) * 100}%`, background: SERI[i] }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
        {status.map((s, i) => (
          <li key={s.status} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERI[i] }} aria-hidden="true" />
              {LABEL_STATUS[s.status]}
            </span>
            <span className="tabular-nums text-ink">
              <b>{angka(s.jumlah)}</b>{' '}
              <span className="text-xs text-ink-faint">{total ? Math.round((s.jumlah / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const GAYA_POIN = {
  bahaya: { ikon: TriangleAlert, kelas: 'bg-orange-50 text-tinggi' },
  waspada: { ikon: Info, kelas: 'bg-amber-50 text-sedang' },
  baik: { ikon: CheckCircle2, kelas: 'bg-green-50 text-rendah' },
  netral: { ikon: BarChart3, kelas: 'bg-sky-50 text-sky-700' },
}

/** Rekomendasi tindakan sesuai tingkat: kab/kota bertindak, provinsi & pusat memberi arahan satu tingkat di bawah. */
function rekomendasi(h, tingkat) {
  const kategoriLewat = [...h.kategori].sort((a, b) => b.lewat - a.lewat)[0]
  const menunggu = h.status.find((s) => s.status === 'klaim_selesai')?.jumlah ?? 0
  const r = []
  if (tingkat === TINGKAT.KABKOTA) {
    if (h.jumlahLewat)
      r.push({
        teks: `Dahulukan ${h.jumlahLewat} laporan lewat target${kategoriLewat?.lewat ? `, terutama ${kategoriLewat.label.toLowerCase()}` : ''}.`,
        ke: '/instansi/antrean?urut=prioritas&sla=lewat',
        aksi: 'Buka antrean',
      })
    if (h.palingLewat?.lewat && h.wilayah.length >= 2)
      r.push({
        teks: `Kirim regu ke ${h.palingLewat.nama} (${h.palingLewat.lewat} laporan lewat target).`,
        ke: '/instansi/rencana',
        aksi: 'Rencana kerja regu',
      })
    if (menunggu)
      r.push({ teks: `${menunggu} klaim selesai menunggu verifikasi warga: pantau agar tidak dibuka ulang.` })
  } else {
    const bawahan = tingkat === TINGKAT.PUSAT ? 'admin provinsi' : 'admin kab/kota'
    if (h.palingLewat?.lewat)
      r.push({
        teks: `Beri arahan ke ${bawahan} ${h.palingLewat.nama}: ${h.palingLewat.lewat} laporan lewat target.`,
        ke: '/instansi/supervisi',
        aksi: 'Kirim arahan',
      })
    const terendah = h.wilayah.find((w) => w.total >= 3)
    if (terendah && terendah.id !== h.palingLewat?.id)
      r.push({
        teks: `Pantau ${terendah.nama}: penyelesaian baru ${terendah.laju}%.`,
        ke: '/instansi/peringkat',
        aksi: 'Lihat peringkat',
      })
    if (kategoriLewat?.lewat)
      r.push({
        teks: `${kategoriLewat.label} paling sering terlambat: pertimbangkan dukungan anggaran/alat untuk jenis ini.`,
        ke: '/instansi/anggaran',
        aksi: 'Kebutuhan anggaran',
      })
  }
  if (!r.length) r.push({ teks: 'Tidak ada tindakan mendesak. Pertahankan kecepatan penanganan.' })
  return r
}

export default function GrafikAnalisis({ h, tingkat, labelKelompok, loading }) {
  if (loading)
    return (
      <Panel judul="Grafik & analisis" ikon={BarChart3}>
        <Kerangka />
      </Panel>
    )
  if (!h.total)
    return (
      <Panel judul="Grafik & analisis" ikon={BarChart3}>
        <p className="text-sm text-ink-soft">Belum ada laporan di cakupan ini.</p>
      </Panel>
    )

  const wilayahTampil = h.wilayah.filter((w) => w.total >= 2).slice(0, 8)
  const terbaik = [...h.wilayah]
    .filter((w) => w.total >= 3)
    .sort((a, b) => b.laju - a.laju)
    .slice(0, 3)
  return (
    <section className="mt-5 space-y-5" aria-label="Grafik dan analisis">
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel judul="Tren laporan 12 minggu" className="min-w-0" ikon={TrendingUp}>
          <GrafikTren mingguan={h.mingguan} />
        </Panel>
        <Panel judul="Analisis" className="min-w-0" ikon={Lightbulb}>
          <ul className="space-y-3">
            {h.poin.map((p) => {
              const g = GAYA_POIN[p.jenis] ?? GAYA_POIN.netral
              return (
                <li key={p.judul} className="flex gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${g.kelas}`}>
                    <g.ikon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{p.judul}</p>
                    <p className="text-sm leading-snug text-ink">{p.teks}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel judul="Jenis masalah" className="min-w-0" ikon={BarChart3}>
          <BatangHorizontal
            data={h.kategori}
            nilai={(k) => k.jumlah}
            label={(k) => k.label}
            ket={(k) =>
              `${angka(k.jumlah)} · ${Math.round((k.jumlah / h.total) * 100)}%${k.lewat ? ` · ${k.lewat} lewat target` : ''}`
            }
          />
          <TabelData
            kolom={['Jenis', 'Jumlah', 'Terbuka', 'Lewat target']}
            baris={h.kategori.map((k) => [k.label, k.jumlah, k.terbuka, k.lewat])}
          />
        </Panel>

        <Panel judul="Status penanganan" className="min-w-0" ikon={PieChart}>
          <GrafikStatus status={h.status} total={h.total} />
          <TabelData kolom={['Status', 'Jumlah']} baris={h.status.map((s) => [LABEL_STATUS[s.status], s.jumlah])} />
        </Panel>

        <Panel judul={`Penyelesaian per ${labelKelompok}`} className="min-w-0" ikon={ListChecks}>
          {wilayahTampil.length < 2 ? (
            <p className="text-sm text-ink-soft">
              Perbandingan per {labelKelompok} butuh minimal dua {labelKelompok} dengan laporan.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-ink-faint">Terendah dulu · % laporan selesai dari semua laporan</p>
              <BatangHorizontal
                data={wilayahTampil}
                nilai={(w) => w.laju}
                maks={100}
                satuan="%"
                label={(w) => w.nama}
                ket={(w) => `${w.laju}% · ${w.selesai}/${w.total}${w.lewat ? ` · ${w.lewat} lewat` : ''}`}
              />
              {terbaik.length > 0 && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-soft">
                  <Trophy size={13} className="mt-0.5 shrink-0 text-aksen-600" aria-hidden="true" />
                  Terbaik: {terbaik.map((w) => `${w.nama} ${w.laju}%`).join(', ')}
                </p>
              )}
              <TabelData
                kolom={[labelKelompok, 'Total', 'Selesai', 'Penyelesaian', 'Lewat target']}
                baris={h.wilayah.map((w) => [w.nama, w.total, w.selesai, `${w.laju}%`, w.lewat])}
              />
            </>
          )}
        </Panel>
      </div>

      <Panel judul="Rekomendasi tindakan" ikon={Lightbulb}>
        <ul className="grid gap-3 md:grid-cols-3">
          {rekomendasi(h, tingkat).map((r) => (
            <li key={r.teks} className="flex flex-col rounded-xl bg-paper p-4">
              <p className="flex-1 text-sm leading-snug text-ink">{r.teks}</p>
              {r.ke && (
                <Link
                  to={r.ke}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800"
                >
                  {r.aksi} <ArrowRight size={13} aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          Dihitung otomatis dari data laporan (tanpa AI). Selesai = sudah diverifikasi warga.
        </p>
      </Panel>
    </section>
  )
}
