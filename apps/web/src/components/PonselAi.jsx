// Mockup ponsel di hero beranda: layar berisi peta Indonesia dengan pin laporan + kartu laporan, dikelilingi
// kartu kaca melayang (chip AI, grafik, perisai terverifikasi) dan cincin partikel Three.js (desktop).
// Dekoratif (aria-hidden); semua angka di sini ilustrasi tampilan, bukan data.
import { BarChart3, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import PetaIndonesia from './PetaIndonesia.jsx'
import Latar3D from './Latar3D.jsx'

function KartuKaca({ className = '', children, jeda = '0s' }) {
  return (
    <div
      className={`absolute rounded-2xl border border-white/50 bg-white/20 p-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md motion-safe:animate-melayang ${className}`}
      style={{ animationDelay: jeda }}
    >
      {children}
    </div>
  )
}

function BatangMini({ tinggi, warna = 'bg-white/85' }) {
  return (
    <div className="flex h-12 items-end gap-1.5">
      {tinggi.map((t, i) => (
        <span key={i} className={`w-2.5 rounded-t ${warna}`} style={{ height: `${t}%` }} />
      ))}
    </div>
  )
}

export default function PonselAi({ className = '' }) {
  return (
    <div className={`relative mx-auto aspect-[5/6] w-full max-w-[520px] ${className}`} aria-hidden="true">
      {/* Cincin partikel Three.js di belakang ponsel */}
      <div className="absolute -inset-10">
        <Latar3D jenis="cincin" />
      </div>
      {/* Cahaya lembut di belakang ponsel (juga pengganti cincin di HP) */}
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/40 blur-3xl" />

      {/* Ponsel */}
      {/* Pembungkus terpisah: posisi/kemiringan di luar, animasi melayang di dalam (keduanya memakai transform). */}
      <div className="absolute left-1/2 top-1/2 w-[50%] -translate-x-1/2 -translate-y-1/2">
        <div className="rotate-[8deg]">
          <div className="relative rounded-[2.4rem] border-[7px] border-[#0f1f2e] bg-[#0f1f2e] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75)] motion-safe:animate-melayang [animation-duration:7s]">
            <div className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#0f1f2e]" />
            <div className="relative aspect-[9/19] overflow-hidden rounded-[1.9rem] bg-gradient-to-b from-[#dff3e8] to-[#bfe5cf]">
              {/* bilah status */}
              <div className="flex items-center justify-between px-5 pt-2.5 text-[9px] font-bold text-brand-900">
                <span>09.41</span>
                <span>CivicPulse</span>
              </div>
              {/* peta */}
              <div className="relative mx-2 mt-4 overflow-hidden rounded-2xl bg-brand-800 p-1.5">
                <PetaIndonesia className="w-full" />
              </div>
              {/* pin besar di atas peta */}
              <span className="absolute left-[30%] top-[16%] flex h-7 w-7 items-center justify-center rounded-full bg-tinggi text-white shadow-lg ring-4 ring-white/60">
                <MapPin size={14} />
              </span>
              <span className="absolute left-[58%] top-[21%] flex h-6 w-6 items-center justify-center rounded-full bg-aksen-400 text-brand-900 shadow-lg ring-4 ring-white/60">
                <MapPin size={12} />
              </span>
              <span className="absolute left-[72%] top-[13%] flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-white/60">
                <ShieldCheck size={12} />
              </span>
              {/* ringkasan & daftar laporan terdekat */}
              <div className="mx-2 mt-2 grid grid-cols-3 gap-1.5">
                {[
                  ['243', 'laporan'],
                  ['62%', 'terbukti'],
                  ['AI', 'aktif'],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-xl bg-white/80 py-1.5 text-center">
                    <p className="text-[11px] font-extrabold leading-none text-brand-800">{n}</p>
                    <p className="mt-0.5 text-[8px] text-ink-soft">{l}</p>
                  </div>
                ))}
              </div>
              <p className="mx-3 mt-2.5 text-[9px] font-extrabold uppercase tracking-wider text-brand-800">
                Laporan terdekat
              </p>
              <div className="mx-2 mt-1 space-y-1.5">
                {[
                  ['bg-tinggi', 'Jalan berlubang', 'Tinggi · 2 hari'],
                  ['bg-aksen-400', 'Lampu jalan mati', 'Sedang · diproses'],
                  ['bg-brand-500', 'Banjir surut', 'Terverifikasi warga'],
                ].map(([w, j, k]) => (
                  <div key={j} className="flex items-center gap-2 rounded-xl bg-white/80 px-2 py-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${w}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold text-ink">{j}</p>
                      <p className="text-[8px] text-ink-soft">{k}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* kartu laporan */}
              <div className="absolute inset-x-2 bottom-3 rounded-2xl bg-white p-2.5 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="h-9 w-12 shrink-0 rounded-lg bg-[url('/pesona/gedung-sate.webp')] bg-cover bg-center" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-extrabold text-ink">Drainase tersumbat</p>
                    <p className="text-[9px] text-ink-soft">Prioritas tinggi · skor 73</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full w-[73%] rounded-full bg-brand-500" />
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="h-1.5 flex-1 rounded-full bg-line" />
                  <span className="h-1.5 w-1/3 rounded-full bg-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chip AI */}
      <KartuKaca className="left-[14%] top-[4%] !rounded-3xl !p-0">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-[0_0_40px_rgba(108,194,143,0.8)] ring-2 ring-brand-200/80">
          <span className="font-display text-3xl font-extrabold text-white">AI</span>
          <Sparkles size={16} className="absolute right-2 top-2 text-aksen-300" />
          {/* kaki-kaki chip */}
          <span className="absolute -left-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-0.5 w-2 rounded bg-brand-200" />
            ))}
          </span>
          <span className="absolute -right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-0.5 w-2 rounded bg-brand-200" />
            ))}
          </span>
        </div>
      </KartuKaca>

      {/* Grafik kanan atas */}
      <KartuKaca className="right-[2%] top-[8%]" jeda="-2s">
        <BarChart3 size={14} className="mb-1 text-white" />
        <BatangMini tinggi={[35, 60, 45, 80, 65, 95]} />
      </KartuKaca>

      {/* Grafik kiri tengah */}
      <KartuKaca className="left-[2%] top-[46%]" jeda="-4s">
        <BatangMini tinggi={[50, 30, 70, 55, 90]} warna="bg-aksen-300/90" />
      </KartuKaca>

      {/* Perisai terverifikasi */}
      <KartuKaca className="right-[6%] top-[52%]" jeda="-1s">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-[0_0_24px_rgba(22,167,92,0.8)]">
          <ShieldCheck size={22} />
        </span>
      </KartuKaca>

      {/* Lencana bawah */}
      <KartuKaca className="bottom-[6%] left-[10%] !py-2" jeda="-3s">
        <p className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Sparkles size={13} className="text-aksen-300" /> AI memberi konteks dalam hitungan detik
        </p>
      </KartuKaca>
    </div>
  )
}
