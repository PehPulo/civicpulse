// Latar hero situs warga (Three.js): "bentang laporan" — medan titik bergelombang dengan pin laporan yang melayang
// dan denyut sinyal. HANYA dimuat di desktop (≥1024px, WebGL, tanpa reduced-motion, tanpa hemat data);
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

    // ── Pin laporan melayang + cincin sinyal ──
    const pin = []
    const geomPin = new THREE.ConeGeometry(0.35, 1.1, 16)
    geomPin.rotateX(Math.PI)
    const geomBola = new THREE.SphereGeometry(0.42, 20, 16)
    const geomCincin = new THREE.RingGeometry(0.6, 0.75, 40)
    geomCincin.rotateX(-Math.PI / 2)
    const WARNA_PIN = [0xffd026, 0xffd026, 0xffffff, 0xe8590c, 0x6cc28f]
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group()
      const mat = new THREE.MeshBasicMaterial({ color: WARNA_PIN[i % WARNA_PIN.length] })
      const kerucut = new THREE.Mesh(geomPin, mat)
      const bola = new THREE.Mesh(geomBola, mat)
      bola.position.y = 0.7
      kerucut.position.y = 0
      g.add(kerucut, bola)
      const cincin = new THREE.Mesh(
        geomCincin,
        new THREE.MeshBasicMaterial({ color: 0xffd026, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
      )
      g.position.set((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 40)
      scene.add(g, cincin)
      pin.push({ g, cincin, fase: Math.random() * Math.PI * 2, kecepatan: 0.6 + Math.random() * 0.6 })
    }

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
      for (const p of pin) {
        const { x, z } = p.g.position
        const dasar = Math.sin(x * 0.18 + t * 0.7) * 1.1 + Math.cos(z * 0.22 + t * 0.5) * 0.9
        p.g.position.y = dasar + 2.2 + Math.sin(t * p.kecepatan + p.fase) * 0.5
        p.g.rotation.y = t * 0.6 + p.fase
        const s = ((t * 0.5 + p.fase) % 2) / 2 // 0→1 denyut
        p.cincin.position.set(x, dasar + 0.05, z)
        p.cincin.scale.setScalar(1 + s * 3.5)
        p.cincin.material.opacity = 0.6 * (1 - s)
      }
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
