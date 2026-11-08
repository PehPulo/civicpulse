// PEMILIK: Yance (sisi instansi) · halaman baru: Ezra · KONTRAK: docs/AI.md § Pemakaian & biaya
// Meteran AI hari ini (dihitung server: GET /ai/pemakaian) + hasil evaluasi model (ml/models.json).
// Semua angka di sini hitungan nyata: token terpakai vs plafon, perkiraan sisa panggilan, rasio cache,
// keluaran yang ditolak pengaman, dan waktu proses computer vision.
import { useCallback, useEffect, useState } from 'react'
import {
  Coins,
  Gauge,
  Image as IkonGambar,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react'
import registry from '../../../../../ml/models.json'
import { AI_DI_SERVER, pemakaianAi } from '../../ai/index.js'
import { Batang, JudulHalaman, KartuAngka, Panel, angka } from '../../components/instansi/ui.jsx'

const VISION = registry.model[registry.aktif.vision]
const LLM = registry.model[registry.aktif.llm]
const pct = (x) => `${(x * 100).toFixed(1).replace('.', ',')}%`

export default function AiPetugas() {
  const [m, setM] = useState(null)
  const [proses, setProses] = useState(false)
  const [waktu, setWaktu] = useState(null)

  const muat = useCallback(async () => {
    setProses(true)
    setM(await pemakaianAi())
    setWaktu(new Date())
    setProses(false)
  }, [])
  useEffect(() => {
    muat()
  }, [muat])

  const llm = m?.llm
  const vis = m?.vision
  const terpakai = llm ? llm.batasTokenHarian - llm.sisaToken : 0
  const persenPakai = llm ? (terpakai / llm.batasTokenHarian) * 100 : 0
  const sisaPanggilan = llm ? Math.floor(llm.sisaToken / llm.perkiraanTokenPerPanggilan) : 0
  const totalPermintaan = llm ? llm.panggilan + llm.cache : 0
  const rasioCache = totalPermintaan ? llm.cache / totalPermintaan : 0
  const tokenRata = llm?.panggilan ? Math.round(llm.token / llm.panggilan) : 0

  return (
    <div>
      <JudulHalaman
        ikon={Sparkles}
        judul="AI & pemakaian"
        sub="Meteran hari ini (UTC) dihitung server. Plafon dipasang di bawah kuota gratis Groq, jadi biaya maksimal Rp 0."
        kanan={
          <button type="button" onClick={muat} disabled={proses} className="btn-ghost min-h-10 py-2 text-sm">
            {proses ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />} Muat ulang
          </button>
        }
      />

      {!AI_DI_SERVER && (
        <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          AI server tidak aktif (VITE_API_URL/VITE_AI_URL kosong). Meteran hanya tersedia dalam mode server.
        </p>
      )}
      {AI_DI_SERVER && !m && !proses && (
        <p className="mb-5 rounded-xl bg-orange-50 p-4 text-sm text-tinggi">Meteran tidak dapat dimuat dari server.</p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KartuAngka
          label="Token LLM hari ini"
          ikon={Coins}
          nilai={angka(terpakai)}
          ket={`dari plafon ${angka(llm?.batasTokenHarian)}`}
          memuat={proses && !m}
        />
        <KartuAngka
          label="Sisa panggilan (perkiraan)"
          ikon={Gauge}
          nilai={angka(sisaPanggilan)}
          ket={`sisa ${angka(llm?.sisaToken)} token ÷ ${llm?.perkiraanTokenPerPanggilan ?? 800}`}
          nada={sisaPanggilan < 20 ? 'waspada' : 'baik'}
          memuat={proses && !m}
        />
        <KartuAngka
          label="Hemat dari cache"
          ikon={Zap}
          nilai={pct(rasioCache)}
          ket={`${llm?.cache ?? 0} dari ${totalPermintaan} permintaan, 0 token`}
          memuat={proses && !m}
        />
        <KartuAngka
          label="Analisis foto (CV)"
          ikon={IkonGambar}
          nilai={angka(vis?.analisis)}
          ket={`rata-rata ${vis?.rataMs ?? 0} ms per analisis`}
          memuat={proses && !m}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          judul="LLM · Groq"
          ikon={Sparkles}
          kanan={
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${llm?.aktif ? 'bg-green-50 text-rendah' : 'bg-paper text-ink-faint'}`}
            >
              {llm?.aktif ? 'aktif' : 'mati'}
            </span>
          }
        >
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">Pemakaian plafon harian</span>
            <span className="tabular-nums text-ink-soft">{persenPakai.toFixed(1).replace('.', ',')}%</span>
          </div>
          <div className="mt-2">
            <Batang
              nilai={persenPakai}
              tinggi="h-3"
              warna={persenPakai > 80 ? 'bg-tinggi' : persenPakai > 50 ? 'bg-sedang' : 'bg-brand-500'}
              label="Pemakaian plafon token"
            />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ['Panggilan ke Groq', llm?.panggilan],
              ['Token rata-rata', tokenRata],
              ['Dari cache', llm?.cache],
              ['Ditolak pengaman', llm?.ditolak],
              ['Gagal / kuota', llm?.gagal],
              ['Batas per IP', `${llm?.batasPerMenitPerIp ?? '-'}/menit`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-ink-faint">{k}</dt>
                <dd className="text-lg font-extrabold tabular-nums text-ink">{v ?? 0}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-xl bg-paper p-3 text-xs text-ink-soft">
            Model <strong className="text-ink">{llm?.model ?? LLM.modelId}</strong> ({llm?.versi ?? registry.aktif.llm})
            · prompt {(llm?.prompt ?? []).join(', ')}. Uji ringkasan: {LLM.evaluasi?.ringkasanDasbor?.lolos}/
            {LLM.evaluasi?.ringkasanDasbor?.jumlah} lolos pengaman, rata-rata {LLM.evaluasi?.ringkasanDasbor?.tokenRata}{' '}
            token, median {LLM.evaluasi?.ringkasanDasbor?.latensiMedianMs} ms.
          </div>
        </Panel>

        <Panel
          judul="Computer vision · CLIP"
          ikon={IkonGambar}
          kanan={
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-rendah">di server</span>
          }
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ['Analisis hari ini', vis?.analisis ?? 0],
              ['Waktu rata-rata', `${vis?.rataMs ?? 0} ms`],
              ['Batas per IP', `${vis?.batasPerMenitPerIp ?? 30}/menit`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-ink-faint">{k}</dt>
                <dd className="text-lg font-extrabold tabular-nums text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-faint">
            Hasil evaluasi ({VISION.evaluasi?.tanggal})
          </p>
          <ul className="mt-2 space-y-3">
            {[
              [
                'Kategori benar di tebakan pertama',
                VISION.evaluasi?.akurasiTop1,
                `${VISION.evaluasi?.jumlahFoto} foto`,
              ],
              [
                'Kategori benar di 3 tebakan teratas',
                VISION.evaluasi?.akurasiTop3,
                `${VISION.evaluasi?.jumlahFoto} foto`,
              ],
              [
                'Verifikasi beres/belum benar',
                VISION.evaluasi?.verifikasi?.akurasi,
                `${VISION.evaluasi?.verifikasi?.jumlahFoto} foto`,
              ],
            ].map(([k, v, n]) => (
              <li key={k}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink">{k}</span>
                  <span className="font-bold tabular-nums">{pct(v ?? 0)}</span>
                </div>
                <Batang nilai={(v ?? 0) * 100} warna="bg-violet-500" label={k} />
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  {n} · {VISION.hfId}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel judul="Pengaman yang aktif" ikon={ShieldCheck} className="mt-5">
        <ul className="grid gap-3 text-sm md:grid-cols-2">
          {[
            [
              ShieldCheck,
              'Fakta dihitung server',
              'LLM hanya menerima angka hasil @civicpulse/core. Deskripsi warga tidak pernah masuk prompt.',
            ],
            [
              ShieldX,
              'Angka karangan ditolak',
              'Setiap angka di keluaran harus ada di fakta; kalau tidak, ditampilkan versi berbasis aturan.',
            ],
            [
              Coins,
              'Plafon token harian',
              'Dipakai bersama semua fitur LLM. Habis ⇒ kembali ke templat, tidak pernah ada tagihan.',
            ],
            [
              Timer,
              'Batas laju & antrean',
              'Batas per IP untuk ringkasan, foto, dan fitur petugas; inferensi foto maks. 2 bersamaan.',
            ],
          ].map(([Ikon, judul, isi]) => (
            <li key={judul} className="flex gap-3 rounded-xl bg-paper p-3">
              <Ikon size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              <span>
                <strong className="block text-ink">{judul}</strong>
                <span className="text-ink-soft">{isi}</span>
              </span>
            </li>
          ))}
        </ul>
        {waktu && <p className="mt-3 text-xs text-ink-faint">Diperbarui {waktu.toLocaleTimeString('id-ID')}.</p>}
      </Panel>
    </div>
  )
}
