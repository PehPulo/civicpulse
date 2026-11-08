// PEMILIK: Yance (sisi instansi) · halaman baru: Ezra · KONTRAK: docs/FRONTEND.md § /instansi
// Beranda petugas. Semua angka dihitung dari laporan dengan ringkasanAntrean() (@civicpulse/core, diuji).
// Briefing LLM: server menghitung fakta yang SAMA dari datanya sendiri, LLM hanya merangkai kalimat,
// dan keluaran yang mengarang angka ditolak. Tanpa AI ⇒ fakta ditampilkan apa adanya (berbasis aturan).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClock,
  ArrowRight,
  ClipboardCheck,
  Hourglass,
  LayoutDashboard,
  Inbox,
  LoaderCircle,
  RotateCcw,
  ScanSearch,
  Sparkles,
  TimerOff,
  TriangleAlert,
} from 'lucide-react'
import { TARGET_SLA_HARI, faktaBriefing, kategoriById, ringkasanAntrean, slaLaporan } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { AI_DI_SERVER, briefingAntrean } from '../../ai/index.js'
import { DATA_ILUSTRASI, WILAYAH, wilayahById } from '../../lib/peta.js'
import { LencanaPrioritas } from '../../components/Prioritas.jsx'
import {
  Batang,
  ChipSla,
  JudulHalaman,
  KartuAngka,
  Kerangka,
  LencanaAi,
  Panel,
  PesanGalat,
  angka,
  tampilWaktu,
} from '../../components/instansi/ui.jsx'

const PESAN_ALASAN = {
  'ai-mati': 'AI belum aktif di server (kunci Groq kosong).',
  'ditolak-pengaman': 'Teks AI ditolak pengaman karena memuat angka di luar fakta.',
  'plafon-harian': 'Plafon token harian sudah habis.',
  'kuota-groq': 'Kuota Groq sedang penuh.',
  'terlalu-sering': 'Terlalu sering meminta. Coba lagi sebentar.',
  gagal: 'Server AI tidak dapat dihubungi.',
}

function Briefing({ fakta }) {
  const [hasil, setHasil] = useState(null)
  const [proses, setProses] = useState(false)

  const susun = async () => {
    setProses(true)
    const h = await briefingAntrean()
    setHasil(h ?? { sumber: 'template', alasan: 'gagal' })
    setProses(false)
  }

  const teksAi = hasil?.sumber === 'ai' ? hasil.briefing : null
  return (
    <Panel
      judul="Briefing pagi"
      ikon={Sparkles}
      kanan={
        AI_DI_SERVER && (
          <button type="button" onClick={susun} disabled={proses} className="btn-ghost min-h-9 py-1.5 text-xs">
            {proses ? (
              <LoaderCircle size={14} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            {proses ? 'Menyusun…' : teksAi ? 'Susun ulang' : 'Susun dengan AI'}
          </button>
        )
      }
    >
      {teksAi ? (
        <>
          <p className="text-[15px] leading-relaxed text-ink">{teksAi}</p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <LencanaAi judul="Ditulis LLM dari fakta di bawah; angka sudah dicek pengaman">
              {hasil.model ?? 'LLM'}
            </LencanaAi>
            {hasil.cache ? 'dari cache bersama · 0 token' : 'baru disusun'} · prompt {hasil.prompt}
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-soft">
          {hasil?.alasan
            ? `${PESAN_ALASAN[hasil.alasan] ?? 'AI tidak tersedia.'} Fakta berikut dihitung langsung dari data.`
            : AI_DI_SERVER
              ? 'Tekan “Susun dengan AI” untuk briefing naratif. Fakta di bawah sudah dihitung dari data.'
              : 'AI server tidak aktif. Fakta berikut dihitung langsung dari data.'}
        </p>
      )}
      <details className="mt-4 rounded-xl bg-paper p-3" open={!teksAi}>
        <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
          Fakta yang dihitung sistem (dan satu-satunya bahan AI)
        </summary>
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {(hasil?.fakta ?? fakta).split('\n').map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /> {b}
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  )
}

export default function Ringkasan() {
  const [ulang, setUlang] = useState(0)
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [ulang])
  const semua = data ?? []
  const r = ringkasanAntrean(semua)
  const byKode = new Map(semua.map((l) => [l.kode, l]))
  const maksWilayah = Math.max(1, ...r.perWilayah.map((w) => w.terbuka))

  return (
    <div>
      <JudulHalaman
        judul="Ringkasan hari ini"
        ikon={LayoutDashboard}
        sub={`Dihitung ${tampilWaktu(r.dihitung)} dari ${angka(r.total)} laporan. Target waktu: tinggi ${TARGET_SLA_HARI.Tinggi} hari, sedang ${TARGET_SLA_HARI.Sedang} hari, rendah ${TARGET_SLA_HARI.Rendah} hari.`}
        kanan={
          <>
            {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
            <Link to="/instansi/antrean" className="btn-primary min-h-10 py-2 text-sm">
              Buka antrean <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </>
        }
      />
      <PesanGalat galat={error} ulang={() => setUlang((n) => n + 1)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KartuAngka
          label="Terbuka"
          ikon={Inbox}
          nilai={r.terbuka}
          ket={`${r.perLevel.Tinggi} tinggi · ${r.perLevel.Sedang} sedang · ${r.perLevel.Rendah} rendah`}
          memuat={loading}
        />
        <KartuAngka
          label="Lewat target"
          ikon={TimerOff}
          nilai={r.lewatSla}
          nada={r.lewatSla ? 'bahaya' : 'baik'}
          ket="harus didahulukan"
          memuat={loading}
        />
        <KartuAngka
          label="Mendekati batas"
          ikon={AlarmClock}
          nilai={r.mendekatiSla}
          nada={r.mendekatiSla ? 'waspada' : 'netral'}
          ket="sisa ≤ 1 hari"
          memuat={loading}
        />
        <KartuAngka
          label="Menunggu warga"
          ikon={ClipboardCheck}
          nilai={r.menungguVerifikasi}
          ket="klaim selesai, belum diverifikasi"
          memuat={loading}
        />
        <KartuAngka
          label="Umur rata-rata"
          ikon={Hourglass}
          nilai={String(r.umurRataHari).replace('.', ',')}
          satuan="hari"
          ket={`terlama ${String(r.umurMaksHari).replace('.', ',')} hari`}
          memuat={loading}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {loading ? (
            <Panel judul="Briefing pagi" ikon={Sparkles}>
              <Kerangka />
            </Panel>
          ) : (
            <Briefing fakta={faktaBriefing(r, WILAYAH)} />
          )}

          <Panel
            judul={`Lewat target waktu (${r.lewatSla})`}
            ikon={TimerOff}
            padat
            kanan={
              <Link to="/instansi/antrean?urut=prioritas&sla=lewat" className="text-xs font-semibold text-brand-700">
                Lihat semua
              </Link>
            }
          >
            {loading ? (
              <div className="p-5">
                <Kerangka />
              </div>
            ) : r.daftarLewat.length === 0 ? (
              <p className="p-5 text-sm text-ink-soft">Tidak ada laporan yang lewat target. Pertahankan.</p>
            ) : (
              <ul className="divide-y divide-line">
                {r.daftarLewat.slice(0, 6).map((kode) => {
                  const l = byKode.get(kode)
                  return (
                    <li key={kode}>
                      <Link
                        to={`/instansi/laporan/${kode}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-paper sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{l.judul}</p>
                          <p className="text-xs text-ink-faint">
                            {kode} · Kec. {wilayahById(l.wilayahId)?.kecamatan} · {kategoriById(l.kategoriId)?.label}
                          </p>
                        </div>
                        <ChipSla sla={slaLaporan(l)} />
                        <ArrowRight size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel judul="Prioritas teratas" ikon={TriangleAlert} padat>
            {loading ? (
              <div className="p-5">
                <Kerangka />
              </div>
            ) : (
              <ol className="divide-y divide-line">
                {r.teratas.map((kode, i) => {
                  const l = byKode.get(kode)
                  return (
                    <li key={kode}>
                      <Link
                        to={`/instansi/laporan/${kode}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-paper sm:px-5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{l.judul}</p>
                          <p className="text-xs text-ink-faint">{kode}</p>
                        </div>
                        <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </Panel>

          <Panel judul="Beban per kecamatan" ikon={Inbox}>
            {loading ? (
              <Kerangka />
            ) : (
              <ul className="space-y-3">
                {r.perWilayah.slice(0, 7).map((w) => (
                  <li key={w.wilayahId}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <Link
                        to={`/instansi/antrean?wilayah=${w.wilayahId}`}
                        className="truncate font-semibold text-ink hover:text-brand-700"
                      >
                        {wilayahById(w.wilayahId)?.kecamatan ?? w.wilayahId}
                      </Link>
                      <span className="shrink-0 text-xs tabular-nums text-ink-soft">
                        {w.terbuka} terbuka
                        {w.lewatSla > 0 && <span className="font-bold text-tinggi"> · {w.lewatSla} lewat</span>}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Batang
                        nilai={(w.terbuka / maksWilayah) * 100}
                        warna={w.lewatSla ? 'bg-tinggi' : 'bg-brand-500'}
                        label={`${w.terbuka} laporan terbuka`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel judul="Penanda dari AI" ikon={ScanSearch}>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start justify-between gap-3">
                <span className="text-ink-soft">Kategori warga berbeda dengan saran computer vision</span>
                <span className="font-bold tabular-nums text-ink">{r.aiKategoriBeda}</span>
              </li>
              <li className="flex items-start justify-between gap-3">
                <span className="text-ink-soft">Klaim selesai dengan foto verifikasi yang diragukan AI</span>
                <span className="font-bold tabular-nums text-ink">{r.aiFotoDiragukan}</span>
              </li>
              <li className="flex items-start justify-between gap-3">
                <span className="text-ink-soft">Dibuka ulang oleh warga</span>
                <span className="inline-flex items-center gap-1 font-bold tabular-nums text-tinggi">
                  <RotateCcw size={13} aria-hidden="true" /> {r.dibukaUlang}
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-ink-faint">
              Penanda hanya membantu memilah. AI tidak pernah mengubah skor prioritas atau status.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
