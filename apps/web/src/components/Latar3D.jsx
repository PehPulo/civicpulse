// Efek Three.js yang dimuat malas dan hanya bila perangkat mampu (lib/boleh3d.js):
// jenis="titik" ⇒ medan titik bergelombang (Hero3D); jenis="cincin" ⇒ cincin partikel AI (CincinAi3D).
import { Suspense, lazy, useState } from 'react'
import { boleh3D } from '../lib/boleh3d.js'

const Hero3D = lazy(() => import('./Hero3D.jsx'))
const CincinAi3D = lazy(() => import('./CincinAi3D.jsx'))

export default function Latar3D({ jenis = 'titik' }) {
  const [tiga] = useState(boleh3D)
  if (!tiga) return null
  return <Suspense fallback={null}>{jenis === 'cincin' ? <CincinAi3D /> : <Hero3D />}</Suspense>
}
