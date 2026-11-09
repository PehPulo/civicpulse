// Latar hero situs warga (Three.js): medan titik bergelombang di belakang peta Indonesia (PetaIndonesia). HANYA dimuat di desktop (≥1024px, WebGL, tanpa reduced-motion, tanpa hemat data);
// di HP diganti gumpalan CSS ringan (lihat HeroLatar). Berhenti merender saat tidak terlihat / tab tersembunyi.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Hero3D() {
  const wadah = useRef(null)

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0a3d24, 30, 95)
    const kamera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 200)
    kamera.position.set(0, 14, 34)
    kamera.lookAt(0, 0, 0)

    // ── Medan titik ──
    const KOLOM = 120
    const BARIS = 70
    const JARAK = 0.75
    const n = KOLOM * BARIS
    const posisi = new Float32Array(n * 3)
    const warna = new Float32Array(n * 3)
    const hijau = new THREE.Color(0x3fb06e)
    const muda = new THREE.Color(0xc7e9d5)
    for (let i = 0; i < KOLOM; i++)
      for (let j = 0; j < BARIS; j++) {
        const k = (i * BARIS + j) * 3
        posisi[k] = (i - KOLOM / 2) * JARAK
        posisi[k + 2] = (j - BARIS / 2) * JARAK
        const c = hijau.clone().lerp(muda, Math.random() * 0.5)
        warna[k] = c.r
        warna[k + 1] = c.g
        warna[k + 2] = c.b
      }
    const geomTitik = new THREE.BufferGeometry()
    geomTitik.setAttribute('position', new THREE.BufferAttribute(posisi, 3))
    geomTitik.setAttribute('color', new THREE.BufferAttribute(warna, 3))
    const titik = new THREE.Points(
      geomTitik,
      new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85 }),
    )
    scene.add(titik)

    // ── Interaksi: paralaks mouse ──
    const target = { x: 0, y: 0 }
    const gerak = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', gerak, { passive: true })

    const ro = new ResizeObserver(() => {
      if (!el.clientWidth) return
      renderer.setSize(el.clientWidth, el.clientHeight)
      kamera.aspect = el.clientWidth / el.clientHeight
      kamera.updateProjectionMatrix()
    })
    ro.observe(el)

    // Hanya render saat terlihat & tab aktif (hemat baterai).
    let terlihat = true
    const io = new IntersectionObserver(([e]) => (terlihat = e.isIntersecting))
    io.observe(el)

    let frame
    const jam = new THREE.Clock()
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (!terlihat || document.hidden) return
      const t = jam.getElapsedTime()
      const pos = geomTitik.attributes.position.array
      for (let i = 0; i < n; i++) {
        const x = pos[i * 3]
        const z = pos[i * 3 + 2]
        pos[i * 3 + 1] = Math.sin(x * 0.18 + t * 0.7) * 1.1 + Math.cos(z * 0.22 + t * 0.5) * 0.9
      }
      geomTitik.attributes.position.needsUpdate = true
      kamera.position.x += (target.x * 4 - kamera.position.x) * 0.03
      kamera.position.y += (14 - target.y * 2 - kamera.position.y) * 0.03
      kamera.lookAt(0, 0, 0)
      renderer.render(scene, kamera)
    }
    loop()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', gerak)
      ro.disconnect()
      io.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={wadah} className="absolute inset-0" aria-hidden="true" />
}
