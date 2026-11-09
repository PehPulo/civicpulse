// Alur arahan berjenjang (core/arahan.js): Pusat ⇒ Provinsi ⇒ Kab/Kota.
// - Kab/kota: kotak masuk "Arahan atasan" dari admin provinsi untuk laporan di wilayahnya.
// - Provinsi: kotak masuk "Arahan dari pusat" (teruskan ke kab/kota) + laporan yang perlu diarahkan + riwayat.
// - Pusat: laporan yang perlu diarahkan ke admin provinsi + riwayat arahan.
// Arahan dikirim dari halaman detail laporan (POST /laporan/:kode/supervisi); status tetap milik admin kab/kota.
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Forward, Inbox, Landmark, MessagesSquare, Send, TimerOff } from 'lucide-react'
import {
  LABEL_STATUS,
  LABEL_TINGKAT,
  STATUS_TERBUKA,
  TINGKAT,
  arahanDari,
  arahanMenunggu,
  arahanUntuk,
  slaLaporan,
  urutkanAntrean,
} from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { lokasiPendek, wilayahById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import {
  ChipSla,
  JudulHalaman,
  KartuAngka,
  Kerangka,
  LencanaStatus,
  Panel,
  PesanGalat,
  tampilWaktu,
} from '../../components/instansi/ui.jsx'

const ARAH = { pusat: 'Pusat → Provinsi', provinsi: 'Provinsi → Kab/Kota' }
const waktuTerakhir = (daftar) => Date.parse(daftar.at(-1)?.waktu ?? 0)

function BarisArahan({ l, catatan = [], aksi }) {
  const s = catatan.at(-1)
  return (
    <li>
      <Link to={`/instansi/laporan/${l.kode}`} className="flex gap-3 px-4 py-3 hover:bg-paper sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{l.judul}</p>
          <p className="text-xs text-ink-faint">
            {l.kode} · {lokasiPendek(wilayahById(l.wilayahId))}
          </p>
          {s && (
            <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950">
              <b>{ARAH[s.tingkat] ?? LABEL_TINGKAT[s.tingkat]}</b> · {tampilWaktu(s.waktu)}: {s.catatan}
              {catatan.length > 1 && <span className="text-amber-800"> (+{catatan.length - 1} lainnya)</span>}
            </p>
          )}
          {aksi && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-700">
              <Forward size={13} aria-hidden="true" /> {aksi}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <LencanaStatus status={l.status} label={LABEL_STATUS[l.status]} />
          <ChipSla sla={slaLaporan(l)} />
        </div>
      </Link>
    </li>
  )
}

function DaftarPanel({ judul, ikon, loading, daftar, kosong, render, kanan, kaki }) {
  return (
    <Panel judul={judul} ikon={ikon} padat kanan={kanan}>
      {loading ? (
        <div className="p-5">
          <Kerangka />
        </div>
      ) : daftar.length === 0 ? (
        <p className="p-5 text-sm text-ink-soft">{kosong}</p>
      ) : (
        <ul className="divide-y divide-line">{daftar.map(render)}</ul>
      )}
      {kaki && (
        <p className="flex items-center gap-1 border-t border-line px-5 py-2.5 text-xs text-ink-faint">
          <ArrowRight size={12} aria-hidden="true" /> {kaki}
        </p>
      )}
    </Panel>
  )
}

export default function Supervisi() {
  const k = useCakupan()
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])
  const semua = k.saring(data)

  // ── Kab/kota: arahan dari provinsi ──
  if (k.menangani) {
    const berarahan = semua
      .filter((l) => arahanUntuk(l, TINGKAT.KABKOTA).length)
      .sort((a, b) => waktuTerakhir(arahanUntuk(b, TINGKAT.KABKOTA)) - waktuTerakhir(arahanUntuk(a, TINGKAT.KABKOTA)))
    const terbuka = berarahan.filter((l) => arahanMenunggu(l, TINGKAT.KABKOTA))
    const selesai = berarahan.filter((l) => !STATUS_TERBUKA.includes(l.status))
    const total = berarahan.reduce((s, l) => s + arahanUntuk(l, TINGKAT.KABKOTA).length, 0)
    return (
      <div>
        <JudulHalaman
          judul="Arahan atasan"
          ikon={MessagesSquare}
          sub={`Arahan dari admin provinsi untuk laporan di ${k.namaCakupan}. Tindak lanjuti dari halaman laporan.`}
        />
        <PesanGalat galat={error} />
        <div className="mb-5 grid grid-cols-3 gap-3">
          <KartuAngka
            label="Perlu ditindaklanjuti"
            ikon={Inbox}
            nilai={terbuka.length}
            nada={terbuka.length ? 'waspada' : 'baik'}
            memuat={loading}
          />
          <KartuAngka label="Arahan provinsi" ikon={MessagesSquare} nilai={total} memuat={loading} />
          <KartuAngka
            label="Sudah tertangani"
            ikon={ClipboardCheck}
            nilai={selesai.length}
            nada="baik"
            memuat={loading}
          />
        </div>
        <DaftarPanel
          judul={`Arahan untuk laporan terbuka (${terbuka.length})`}
          ikon={MessagesSquare}
          loading={loading}
          daftar={terbuka}
          kosong="Tidak ada arahan yang menunggu. Kerja bagus."
          render={(l) => <BarisArahan key={l.kode} l={l} catatan={arahanUntuk(l, TINGKAT.KABKOTA)} />}
        />
      </div>
    )
  }

  // ── Provinsi / pusat ──
  const pusat = k.tingkat === TINGKAT.PUSAT
  const saya = k.tingkat
  const bawahan = pusat ? 'admin provinsi' : 'admin kab/kota'
  const dariSaya = semua
    .filter((l) => arahanDari(l, saya).length)
    .sort((a, b) => waktuTerakhir(arahanDari(b, saya)) - waktuTerakhir(arahanDari(a, saya)))
  const totalTerkirim = dariSaya.reduce((s, l) => s + arahanDari(l, saya).length, 0)
  const perluArahan = urutkanAntrean(
    semua.filter((l) => STATUS_TERBUKA.includes(l.status) && slaLaporan(l).lewat && !arahanDari(l, saya).length),
    'prioritas',
  )
  const dariPusat = pusat ? [] : semua.filter((l) => arahanMenunggu(l, TINGKAT.PROVINSI))

  return (
    <div>
      <JudulHalaman
        judul={pusat ? 'Arahan ke admin provinsi' : `Supervisi & arahan pusat · ${k.namaCakupan}`}
        ikon={ClipboardCheck}
        sub={
          pusat
            ? 'Arahan pusat diterima admin provinsi, lalu diteruskan ke admin kab/kota yang menangani laporan.'
            : 'Arahan dari pusat yang perlu Anda teruskan, laporan lewat target yang belum diarahkan, dan riwayat arahan Anda ke admin kab/kota.'
        }
      />
      <PesanGalat galat={error} />
      <div className={`mb-5 grid gap-3 ${pusat ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {!pusat && (
          <KartuAngka
            label="Arahan pusat menunggu"
            ikon={Landmark}
            nilai={dariPusat.length}
            nada={dariPusat.length ? 'waspada' : 'baik'}
            ket="perlu diteruskan ke kab/kota"
            memuat={loading}
          />
        )}
        <KartuAngka
          label="Perlu arahan"
          ikon={TimerOff}
          nilai={perluArahan.length}
          nada={perluArahan.length ? 'bahaya' : 'baik'}
          ket="lewat target, belum diarahkan"
          memuat={loading}
        />
        <KartuAngka label={`Arahan ke ${bawahan}`} ikon={Send} nilai={totalTerkirim} memuat={loading} />
        <KartuAngka
          label="Laporan diarahkan"
          ikon={MessagesSquare}
          nilai={dariSaya.length}
          ket={`${dariSaya.filter((l) => !STATUS_TERBUKA.includes(l.status)).length} sudah tertangani`}
          memuat={loading}
        />
      </div>

      {!pusat && (
        <div className="mb-5">
          <DaftarPanel
            judul={`Arahan dari pusat (${dariPusat.length})`}
            ikon={Landmark}
            loading={loading}
            daftar={dariPusat}
            kosong="Tidak ada arahan pusat yang menunggu. Semua sudah diteruskan ke kab/kota."
            render={(l) => (
              <BarisArahan
                key={l.kode}
                l={l}
                catatan={arahanUntuk(l, TINGKAT.PROVINSI)}
                aksi="Buka untuk meneruskan ke admin kab/kota"
              />
            )}
            kaki="Arahan dianggap ditindaklanjuti setelah Anda mengirim arahan ke admin kab/kota untuk laporan itu."
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <DaftarPanel
          judul={`Perlu arahan (${perluArahan.length})`}
          ikon={TimerOff}
          loading={loading}
          daftar={perluArahan.slice(0, 12)}
          kosong="Semua laporan lewat target sudah diberi arahan."
          render={(l) => <BarisArahan key={l.kode} l={l} />}
          kanan={
            <Link to="/instansi/antrean?sla=lewat" className="text-xs font-semibold text-brand-700">
              Semua lewat target
            </Link>
          }
        />
        <DaftarPanel
          judul={`Riwayat arahan Anda (${dariSaya.length})`}
          ikon={MessagesSquare}
          loading={loading}
          daftar={dariSaya.slice(0, 20)}
          kosong="Belum ada arahan. Buka laporan dari daftar di samping, lalu kirim arahan."
          render={(l) => <BarisArahan key={l.kode} l={l} catatan={arahanDari(l, saya)} />}
          kaki={`Arahan tampil di meja kerja ${bawahan} terkait.`}
        />
      </div>
    </div>
  )
}
