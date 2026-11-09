// Medan titik Three.js (Hero3D) yang dimuat malas dan hanya bila perangkat mampu (lib/boleh3d.js).
import { Suspense, lazy, useState } from 'react'
import { boleh3D } from '../lib/boleh3d.js'

const Hero3D = lazy(() => import('./Hero3D.jsx'))

export default function Latar3D() {
  const [tiga] = useState(boleh3D)
  if (!tiga) return null
  return (
    <Suspense fallback={null}>
      <Hero3D />
    </Suspense>
  )
}
