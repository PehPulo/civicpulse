// PEMILIK: Ezra (sisi warga) · Latar beranda bernuansa Indonesia dari bawah hero sampai CTA terakhir:
// langit mint, siluet ikon Nusantara di tepi kiri/kanan (Borobudur, Monas, gunungan wayang, rumah gadang,
// candi bentar), dedaunan tropis, dan perbukitan hijau di dasar. Tanpa motif batik berulang (sengaja tidak ramai).
// Partikel Three.js menempel di layar sepanjang bagian ini (Nusantara3D, tablet/desktop saja).
// Murni dekoratif: aria-hidden, pointer-events-none, SVG inline (tanpa unduhan gambar).
import Latar3D from './Latar3D.jsx'

const HIJAU_TUA = '#0a3d24'
const HIJAU = '#055c34'

function Borobudur({ className }) {
  return (
    <svg viewBox="0 0 400 250" className={className} fill={HIJAU_TUA}>
      <rect x="0" y="215" width="400" height="35" rx="2" />
      <rect x="28" y="182" width="344" height="36" rx="2" />
      <rect x="58" y="152" width="284" height="33" rx="2" />
      <rect x="86" y="126" width="228" height="29" rx="2" />
      <rect x="112" y="104" width="176" height="25" rx="2" />
      {[130, 162, 194, 226, 258].map((x) => (
        <g key={x}>
          <path d={`M${x - 11} 104 Q${x - 11} 86 ${x} 84 Q${x + 11} 86 ${x + 11} 104 Z`} />
          <rect x={x - 1.5} y="74" width="3" height="11" />
        </g>
      ))}
      {[150, 200, 250].map((x) => (
        <path key={x} d={`M${x - 13} 104 Q${x - 13} 80 ${x} 77 Q${x + 13} 80 ${x + 13} 104 Z`} />
      ))}
      <path d="M168 104 Q168 56 200 52 Q232 56 232 104 Z" />
      <rect x="196" y="22" width="8" height="32" />
      <path d="M190 30 L210 30 L204 12 L196 12 Z" />
    </svg>
  )
}

function Monas({ className }) {
  return (
    <svg viewBox="0 0 200 600" className={className} fill={HIJAU_TUA}>
      <path d="M100 4 C114 20 112 34 106 46 L94 46 C88 34 86 20 100 4 Z" fill="#d9a900" />
      <rect x="90" y="46" width="20" height="10" rx="2" />
      <path d="M92 56 L108 56 L120 380 L80 380 Z" />
      <path d="M22 380 L178 380 C170 410 148 424 124 428 L76 428 C52 424 30 410 22 380 Z" />
      <rect x="40" y="428" width="120" height="34" rx="3" />
      <rect x="14" y="462" width="172" height="22" rx="3" />
      <rect x="0" y="484" width="200" height="16" rx="3" />
    </svg>
  )
}

function Gunungan({ className }) {
  return (
    <svg viewBox="0 0 220 360" className={className}>
      <path d="M110 4 C150 70 214 170 208 300 L12 300 C6 170 70 70 110 4 Z" fill={HIJAU_TUA} />
      <g fill="none" stroke="#9fd8b6" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M110 290 L110 70" />
        <path d="M110 110 C90 120 78 140 74 160 M110 110 C130 120 142 140 146 160" />
        <path d="M110 160 C84 172 66 196 60 222 M110 160 C136 172 154 196 160 222" />
        <path d="M110 214 C88 224 74 244 70 264 M110 214 C132 224 146 244 150 264" />
        <circle cx="110" cy="62" r="8" />
        <path d="M80 262 L140 262 L132 290 L88 290 Z" />
      </g>
      <rect x="70" y="300" width="80" height="16" rx="3" fill={HIJAU_TUA} />
      <rect x="96" y="316" width="28" height="40" rx="3" fill={HIJAU_TUA} />
    </svg>
  )
}

function RumahGadang({ className }) {
  return (
    <svg viewBox="0 0 420 240" className={className} fill={HIJAU_TUA}>
      <path d="M8 26 C40 70 70 96 110 104 C140 74 170 64 210 66 C250 64 280 74 310 104 C350 96 380 70 412 26 C396 92 360 128 330 138 L90 138 C60 128 24 92 8 26 Z" />
      <path d="M150 70 C170 40 190 28 210 24 C230 28 250 40 270 70 C250 66 230 66 210 66 C190 66 170 66 150 70 Z" />
      <rect x="70" y="138" width="280" height="62" rx="2" />
      <g fill="#9fd8b6" opacity="0.35">
        <rect x="100" y="152" width="34" height="28" rx="2" />
        <rect x="160" y="152" width="34" height="28" rx="2" />
        <rect x="226" y="152" width="34" height="28" rx="2" />
        <rect x="286" y="152" width="34" height="28" rx="2" />
      </g>
      {[80, 130, 180, 240, 290, 340].map((x) => (
        <rect key={x} x={x - 3} y="200" width="6" height="40" />
      ))}
    </svg>
  )
}

function CandiBentar({ className }) {
  const menara = (x, arah) => (
    <path
      d={
        arah > 0
          ? `M${x} 260 L${x} 40 L${x + 14} 40 L${x + 14} 70 L${x + 30} 70 L${x + 30} 110 L${x + 48} 110 L${x + 48} 160 L${x + 66} 160 L${x + 66} 210 L${x + 84} 210 L${x + 84} 260 Z`
          : `M${x} 260 L${x} 40 L${x - 14} 40 L${x - 14} 70 L${x - 30} 70 L${x - 30} 110 L${x - 48} 110 L${x - 48} 160 L${x - 66} 160 L${x - 66} 210 L${x - 84} 210 L${x - 84} 260 Z`
      }
    />
  )
  return (
    <svg viewBox="0 0 260 270" className={className} fill={HIJAU_TUA}>
      {menara(112, -1)}
      {menara(148, 1)}
      <rect x="0" y="258" width="260" height="12" rx="2" />
      <path d="M106 40 L112 18 L112 40 Z M154 40 L148 18 L148 40 Z" />
    </svg>
  )
}

function Daun({ className, balik = false }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={balik ? { transform: 'scaleX(-1)' } : undefined}>
      <g fill={HIJAU}>
        <path d="M10 190 C40 120 90 70 190 40 C150 90 110 140 10 190 Z" opacity="0.9" />
        <path d="M10 190 C30 130 40 80 60 10 C80 70 70 130 10 190 Z" opacity="0.7" />
        <path d="M10 190 C70 160 120 150 196 160 C140 180 80 192 10 190 Z" opacity="0.6" />
      </g>
      <g fill="none" stroke="#c7e9d5" strokeWidth="1.5" opacity="0.5">
        <path d="M10 190 C80 130 130 90 190 40" />
        <path d="M10 190 C40 120 50 70 60 10" />
      </g>
    </svg>
  )
}

/** Perbukitan berlapis (pemisah lembut antarbagian & dasar halaman). */
function Bukit({ className }) {
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className={className}>
      <path
        d="M0 150 C180 70 360 60 540 120 C720 180 900 90 1080 80 C1260 70 1360 120 1440 110 L1440 260 L0 260 Z"
        fill="#9fd8b6"
        opacity="0.45"
      />
      <path
        d="M0 190 C220 120 420 150 620 180 C820 210 1020 130 1220 140 C1330 146 1400 170 1440 165 L1440 260 L0 260 Z"
        fill="#6cc28f"
        opacity="0.45"
      />
      <path
        d="M0 230 C240 190 480 210 720 225 C960 240 1200 200 1440 215 L1440 260 L0 260 Z"
        fill="#3fb06e"
        opacity="0.4"
      />
    </svg>
  )
}

export default function LatarNusantara() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-clip" aria-hidden="true">
      {/* langit & cahaya */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e6f4ec] via-[#f1f9f4] to-[#e9f5ee]" />
      <div className="absolute -left-40 top-[3%] h-[36rem] w-[36rem] rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -right-40 top-[22%] h-[32rem] w-[32rem] rounded-full bg-aksen-300/25 blur-3xl" />
      <div className="absolute -left-32 top-[52%] h-[30rem] w-[30rem] rounded-full bg-brand-300/25 blur-3xl" />
      <div className="absolute -right-32 top-[76%] h-[34rem] w-[34rem] rounded-full bg-brand-200/35 blur-3xl" />

      {/* Partikel Three.js menempel di layar sepanjang bagian ini */}
      <div className="absolute inset-0">
        <div className="sticky top-0 h-screen w-full">
          <Latar3D jenis="nusantara" />
        </div>
      </div>

      {/* siluet ikon Nusantara di tepi (tablet ke atas; di HP cukup bukit & cahaya) */}
      <div className="hidden md:block">
        <Borobudur className="absolute -left-10 top-[4%] w-[26rem] opacity-[0.10]" />
        <Monas className="absolute -right-6 top-[2%] h-[34rem] opacity-[0.11]" />
        <Gunungan className="absolute -right-12 top-[27%] h-[26rem] opacity-[0.10]" />
        <RumahGadang className="absolute -left-16 top-[43%] w-[28rem] opacity-[0.09]" />
        <CandiBentar className="absolute -right-10 top-[60%] w-[20rem] opacity-[0.10]" />
        <Gunungan className="absolute -left-12 top-[76%] h-[24rem] opacity-[0.09]" />
        <Daun className="absolute -left-6 top-[20%] w-40 opacity-[0.22]" />
        <Daun className="absolute -right-6 top-[48%] w-44 opacity-[0.2]" balik />
        <Daun className="absolute -left-8 top-[66%] w-36 opacity-[0.2]" />
        <Daun className="absolute -right-8 top-[88%] w-40 opacity-[0.22]" balik />
      </div>

      {/* perbukitan */}
      <Bukit className="absolute inset-x-0 top-[34%] h-40 w-full opacity-40" />
      <Bukit className="absolute inset-x-0 top-[68%] h-40 w-full opacity-40" />
      <Bukit className="absolute inset-x-0 bottom-0 h-64 w-full" />
    </div>
  )
}
