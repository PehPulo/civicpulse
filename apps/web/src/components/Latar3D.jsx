// Efek Three.js yang dimuat malas dan hanya bila perangkat mampu (lib/boleh3d.js):
// jenis="titik" ⇒ medan titik bergelombang (Hero3D); jenis="cincin" ⇒ cincin partikel AI (CincinAi3D);
// jenis="nusantara" ⇒ kunang-kunang + jaring AI sepanjang beranda (Nusantara3D).
import { Suspense, lazy, useState } from 'react'
import { boleh3D } from '../lib/boleh3d.js'

const Hero3D = lazy(() => import('./Hero3D.jsx'))
const CincinAi3D = lazy(() => import('./CincinAi3D.jsx'))
const Nusantara3D = lazy(() => import('./Nusantara3D.jsx'))
const JENIS = { titik: Hero3D, cincin: CincinAi3D, nusantara: Nusantara3D }

export default function Latar3D({ jenis = 'titik' }) {
  const [tiga] = useState(boleh3D)
  if (!tiga) return null
  const Efek = JENIS[jenis] ?? Hero3D
  return (
    <Suspense fallback={null}>
      <Efek />
    </Suspense>
  )
}
