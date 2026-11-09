// Cincin partikel "AI" (Three.js) yang mengorbit mockup ponsel di hero beranda: dua cincin miring berputar
// berlawanan + percikan kuning. Dimuat malas hanya di desktop (lihat Latar3D). Berhenti saat tak terlihat.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function cincin(n, radius, tebal, warnaA, warnaB) {
  const posisi = new Float32Array(n * 3)
  const warna = new Float32Array(n * 3)
  const a = new THREE.Color(warnaA)
  const b = new THREE.Color(warnaB)
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const r = radius + (Math.random() - 0.5) * tebal
    posisi[i * 3] = Math.cos(t) * r
    posisi[i * 3 + 1] = (Math.random() - 0.5) * tebal * 0.6
    posisi[i * 3 + 2] = Math.sin(t) * r
    const c = a.clone().lerp(b, Math.random())
    warna.set([c.r, c.g, c.b], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(posisi, 3))
  g.setAttribute('color', new THREE.BufferAttribute(warna, 3))
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
}

export default function CincinAi3D() {
  const wadah = useRef(null)

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const kamera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100)
    kamera.position.set(0, 1.2, 9)
    kamera.lookAt(0, 0, 0)

    const grup = new THREE.Group()
    grup.rotation.set(0.35, 0, -0.28)
    const luar = cincin(1400, 3.4, 0.35, 0x6cc28f, 0xc7f9d9)
    const dalam = cincin(900, 2.6, 0.2, 0x16a75c, 0xffe270)
    dalam.rotation.x = 0.5
    grup.add(luar, dalam)

    // Percikan kuning acak di sekitar cincin
    const nP = 160
    const pos = new Float32Array(nP * 3)
    for (let i = 0; i < nP; i++) {
      const t = Math.random() * Math.PI * 2
      const r = 2.2 + Math.random() * 1.8
      pos.set([Math.cos(t) * r, (Math.random() - 0.5) * 2.4, Math.sin(t) * r], i * 3)
    }
    const gP = new THREE.BufferGeometry()
    gP.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const percik = new THREE.Points(
      gP,
      new THREE.PointsMaterial({
        size: 0.09,
        color: 0xffd026,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    grup.add(percik)
    scene.add(grup)

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
    let terlihat = true
    const io = new IntersectionObserver(([e]) => (terlihat = e.isIntersecting))
    io.observe(el)

    let frame
    const jam = new THREE.Clock()
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (!terlihat || document.hidden) return
      const t = jam.getElapsedTime()
      luar.rotation.y = t * 0.25
      dalam.rotation.y = -t * 0.4
      percik.rotation.y = t * 0.12
      percik.material.opacity = 0.55 + Math.sin(t * 2) * 0.25
      grup.rotation.x += (0.35 + target.y * 0.12 - grup.rotation.x) * 0.04
      grup.rotation.z += (-0.28 + target.x * 0.12 - grup.rotation.z) * 0.04
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
