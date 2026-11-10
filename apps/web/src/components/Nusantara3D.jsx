// Latar Three.js sepanjang beranda (di bawah hero): ribuan partikel cahaya hijau & emas melayang naik seperti
// kunang-kunang di hutan tropis, plus jaring titik "AI" yang berdenyut. Kamera ikut bergeser saat digulir
// (paralaks) dan mengikuti mouse. Dimuat malas hanya di tablet/desktop (lib/boleh3d.js); berhenti merender saat
// tidak terlihat atau tab disembunyikan.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** Tekstur titik bulat bercahaya (dibuat di kanvas, tanpa unduhan). */
function teksturCahaya() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Nusantara3D() {
  const wadah = useRef(null)

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const kamera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 200)
    kamera.position.set(0, 0, 40)
    const tekstur = teksturCahaya()

    // ── Kunang-kunang: hijau & emas, melayang naik ──
    const N = 1400
    const LEBAR = 120
    const TINGGI = 80
    const DALAM = 60
    const pos = new Float32Array(N * 3)
    const warna = new Float32Array(N * 3)
    const laju = new Float32Array(N)
    const fase = new Float32Array(N)
    const palet = [0x16a75c, 0x3fb06e, 0x6cc28f, 0xffd026, 0xc4f23a].map((h) => new THREE.Color(h))
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * LEBAR
      pos[i * 3 + 1] = (Math.random() - 0.5) * TINGGI
      pos[i * 3 + 2] = (Math.random() - 0.5) * DALAM
      const c = palet[Math.floor(Math.random() * palet.length)]
      warna.set([c.r, c.g, c.b], i * 3)
      laju[i] = 0.6 + Math.random() * 1.6
      fase[i] = Math.random() * Math.PI * 2
    }
    const geomKunang = new THREE.BufferGeometry()
    geomKunang.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geomKunang.setAttribute('color', new THREE.BufferAttribute(warna, 3))
    const kunang = new THREE.Points(
      geomKunang,
      new THREE.PointsMaterial({
        size: 0.9,
        map: tekstur,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    )
    scene.add(kunang)

    // ── Jaring "AI": simpul pada bola berputar pelan, garis antar-simpul terdekat ──
    const SIMPUL = 90
    const titikJaring = []
    for (let i = 0; i < SIMPUL; i++) {
      const u = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      const r = 11 + Math.random() * 2
      titikJaring.push(new THREE.Vector3(r * Math.sin(v) * Math.cos(u), r * Math.sin(v) * Math.sin(u), r * Math.cos(v)))
    }
    const garis = []
    for (let i = 0; i < SIMPUL; i++)
      for (let j = i + 1; j < SIMPUL; j++)
        if (titikJaring[i].distanceTo(titikJaring[j]) < 5.2) garis.push(titikJaring[i], titikJaring[j])
    const jaring = new THREE.Group()
    jaring.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(garis),
        new THREE.LineBasicMaterial({ color: 0x069550, transparent: true, opacity: 0.28 }),
      ),
    )
    const simpul = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(titikJaring),
      new THREE.PointsMaterial({ size: 1.1, map: tekstur, color: 0x16a75c, transparent: true, depthWrite: false }),
    )
    jaring.add(simpul)
    jaring.position.set(30, 0, -12)
    scene.add(jaring)

    // ── Interaksi: mouse & gulir ──
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
      const dt = Math.min(jam.getDelta(), 0.05)
      const t = jam.elapsedTime
      const p = geomKunang.attributes.position.array
      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += laju[i] * dt * 1.4
        p[i * 3] += Math.sin(t * 0.6 + fase[i]) * dt * 0.8
        if (p[i * 3 + 1] > TINGGI / 2) p[i * 3 + 1] = -TINGGI / 2
      }
      geomKunang.attributes.position.needsUpdate = true
      kunang.material.opacity = 0.6 + Math.sin(t * 1.3) * 0.12

      // jaring AI berputar & berdenyut; bergeser sisi seiring gulir
      const gulir = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)
      jaring.rotation.y = t * 0.12
      jaring.rotation.x = Math.sin(t * 0.2) * 0.3
      jaring.position.x = 30 * Math.cos(gulir * Math.PI * 2)
      jaring.position.y = 6 * Math.sin(gulir * Math.PI * 3)
      simpul.material.size = 1.0 + Math.sin(t * 2) * 0.25

      kamera.position.x += (target.x * 5 - kamera.position.x) * 0.03
      kamera.position.y += (-target.y * 3 - gulir * 10 - kamera.position.y) * 0.03
      kamera.lookAt(0, -gulir * 10, 0)
      renderer.render(scene, kamera)
    }
    loop()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', gerak)
      ro.disconnect()
      io.disconnect()
      tekstur.dispose()
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
