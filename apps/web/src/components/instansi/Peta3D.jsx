// PEMILIK: Ezra · Peta 3D interaktif (Three.js). Batas wilayah GeoJSON diekstrusi: TINGGI = nilai metrik
// (dihitung agregatWilayah di core), WARNA = porsi laporan terbuka yang lewat target waktu.
// Interaksi: seret = putar, gulir = zoom, arahkan = info, klik = turun ke wilayah (bila diizinkan).
// Batas: geoBoundaries (BPS 2020 / OSM) disederhanakan oleh data/scripts/build-geo.js → public/geo/*.json.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const WARNA_LEVEL = { Tinggi: 0xe8590c, Sedang: 0xf59f00, Rendah: 0x2f9e44 }

/** Hijau (aman) → kuning → oranye (banyak lewat target). r ∈ [0,1]. */
function warnaRisiko(r) {
  const c = new THREE.Color()
  const hijau = new THREE.Color(0x2bb39a)
  const kuning = new THREE.Color(0xf5b83d)
  const oranye = new THREE.Color(0xe8590c)
  if (r <= 0.5) c.lerpColors(hijau, kuning, r / 0.5)
  else c.lerpColors(kuning, oranye, (r - 0.5) / 0.5)
  return c
}

function cincinKeShape(ring, proj) {
  const pts = ring.map(([lng, lat]) => proj(lng, lat))
  return pts
}

function poligonDari(geom) {
  if (!geom) return []
  if (geom.type === 'Polygon') return [geom.coordinates]
  if (geom.type === 'MultiPolygon') return geom.coordinates
  return []
}

function kotakBatas(features) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const f of features)
    for (const poly of poligonDari(f.geometry))
      for (const [lng, lat] of poly[0]) {
        if (lng < minX) minX = lng
        if (lng > maxX) maxX = lng
        if (lat < minY) minY = lat
        if (lat > maxY) maxY = lat
      }
  return { minX, minY, maxX, maxY }
}

const dukungWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/**
 * @param {{
 *   geo: {features: Array<{properties: {id, nama}, geometry}>},
 *   nilai: Map<string, {tinggi: number, rasio: number}>,     tinggi & rasio ∈ [0,1]
 *   fokus?: string|null,           id wilayah yang disorot (lainnya diredupkan)
 *   bisaKlik?: (id) => boolean,
 *   onPilih?: (id) => void,
 *   onArah?: (id|null) => void,
 *   titik?: Array<{lat, lng, level, tinggi}>,                 tiang laporan (opsional)
 *   judulAria: string,
 * }} props
 */
const TANPA_TITIK = []
const SELALU = () => true

export default function Peta3D({
  geo,
  nilai,
  fokus = null,
  bisaKlik = SELALU,
  onPilih,
  onArah,
  titik = TANPA_TITIK,
  judulAria,
}) {
  const wadah = useRef(null)
  const tip = useRef(null)
  const [webgl] = useState(dukungWebGL)
  // Callback terbaru tanpa membangun ulang adegan.
  const cb = useRef({ onPilih, onArah, bisaKlik })
  cb.current = { onPilih, onArah, bisaKlik }

  useEffect(() => {
    const el = wadah.current
    if (!el || !geo || !webgl) return
    const hemat = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // ── Proyeksi: equirectangular dikoreksi cos(lintang), dipusatkan & diskalakan ke lebar ±100 unit ──
    const b = kotakBatas(geo.features)
    const cx = (b.minX + b.maxX) / 2
    const cy = (b.minY + b.maxY) / 2
    const kLng = Math.cos((cy * Math.PI) / 180)
    const lebar = Math.max((b.maxX - b.minX) * kLng, (b.maxY - b.minY) * 1.6)
    const skala = 100 / lebar
    const proj = (lng, lat) => new THREE.Vector2((lng - cx) * kLng * skala, (lat - cy) * skala)
    const TINGGI_MAKS = 14
    const DASAR = 0.8

    // ── Adegan ──
    const scene = new THREE.Scene()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'

    const kamera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 2000)
    kamera.up.set(0, 0, 1)
    const jarak = 100
    kamera.position.set(0, -jarak * 0.85, jarak * 0.75)

    const kontrol = new OrbitControls(kamera, renderer.domElement)
    kontrol.enableDamping = true
    kontrol.dampingFactor = 0.08
    kontrol.maxPolarAngle = Math.PI * 0.45
    kontrol.minDistance = 25
    kontrol.maxDistance = 260
    kontrol.target.set(0, 0, 0)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb8b2, 1.6))
    const matahari = new THREE.DirectionalLight(0xffffff, 1.6)
    matahari.position.set(-60, -80, 140)
    scene.add(matahari)

    // Laut/alas tipis
    const alas = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshStandardMaterial({ color: 0xe7f2ef, roughness: 1 }),
    )
    alas.position.z = -0.05
    scene.add(alas)

    // ── Ekstrusi wilayah ──
    const kelompok = new THREE.Group()
    scene.add(kelompok)
    const meshes = []
    const garisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
    for (const f of geo.features) {
      const id = f.properties.id
      const v = nilai.get(id) ?? { tinggi: 0, rasio: 0 }
      const redup = fokus && id !== fokus
      const shapes = []
      for (const poly of poligonDari(f.geometry)) {
        const luar = cincinKeShape(poly[0], proj)
        if (luar.length < 3) continue
        const shape = new THREE.Shape(luar)
        for (const hole of poly.slice(1)) shape.holes.push(new THREE.Path(cincinKeShape(hole, proj)))
        shapes.push(shape)
      }
      if (!shapes.length) continue
      // Mode fokus (kab/kota): wilayah sendiri dibuat rendah agar tiang laporan di atasnya terlihat.
      const tinggi = DASAR + (redup ? 0 : fokus ? 1.2 : v.tinggi * TINGGI_MAKS)
      const geom = new THREE.ExtrudeGeometry(shapes, { depth: tinggi, bevelEnabled: false, curveSegments: 1 })
      const warna = redup ? new THREE.Color(0xc9d6d3) : warnaRisiko(v.rasio)
      const mat = new THREE.MeshStandardMaterial({
        color: warna,
        roughness: 0.65,
        metalness: 0.05,
        transparent: Boolean(redup),
        opacity: redup ? 0.55 : 1,
        emissive: new THREE.Color(0x000000),
      })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.userData = { id, nama: f.properties.nama, tinggi }
      const tepi = new THREE.LineSegments(new THREE.EdgesGeometry(geom, 30), garisMat)
      mesh.add(tepi)
      kelompok.add(mesh)
      meshes.push(mesh)
    }

    // ── Tiang laporan (opsional) ──
    const tiangGeom = new THREE.CylinderGeometry(0.35, 0.35, 1, 10)
    tiangGeom.rotateX(Math.PI / 2)
    tiangGeom.translate(0, 0, 0.5)
    const fokusMesh = meshes.find((m) => m.userData.id === fokus)
    const dasarTiang = fokusMesh ? fokusMesh.userData.tinggi : DASAR
    for (const t of titik) {
      const p = proj(t.lng, t.lat)
      const m = new THREE.Mesh(
        tiangGeom,
        new THREE.MeshStandardMaterial({ color: WARNA_LEVEL[t.level] ?? 0x2f9e44, roughness: 0.4 }),
      )
      m.position.set(p.x, p.y, dasarTiang)
      m.scale.set(1, 1, 1.5 + t.tinggi * 6)
      kelompok.add(m)
    }

    // Sorot kamera ke wilayah fokus.
    if (fokusMesh) {
      fokusMesh.geometry.computeBoundingBox()
      const c = new THREE.Vector3()
      fokusMesh.geometry.boundingBox.getCenter(c)
      const ukuran = new THREE.Vector3()
      fokusMesh.geometry.boundingBox.getSize(ukuran)
      const d = Math.max(35, Math.max(ukuran.x, ukuran.y) * 2.4)
      kontrol.target.set(c.x, c.y, 0)
      kamera.position.set(c.x, c.y - d * 0.85, d * 0.8)
    }

    // ── Animasi tumbuh ──
    let mulai = performance.now()
    kelompok.scale.z = hemat ? 1 : 0.02

    // ── Interaksi ──
    const ray = new THREE.Raycaster()
    const tikus = new THREE.Vector2()
    let arah = null
    let turun = null

    const sorot = (mesh) => {
      if (arah === mesh) return
      if (arah) arah.material.emissive.setHex(0x000000)
      arah = mesh
      if (arah) arah.material.emissive.setHex(0x1d3b36)
      renderer.domElement.style.cursor = arah && cb.current.bisaKlik(arah.userData.id) ? 'pointer' : 'grab'
      cb.current.onArah?.(arah?.userData.id ?? null)
    }

    const kenai = (e) => {
      const r = renderer.domElement.getBoundingClientRect()
      tikus.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(tikus, kamera)
      return ray.intersectObjects(meshes, false)[0]?.object ?? null
    }

    const gerak = (e) => {
      const m = kenai(e)
      sorot(m)
      if (tip.current) {
        if (m) {
          const r = renderer.domElement.getBoundingClientRect()
          tip.current.style.opacity = '1'
          tip.current.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`
          tip.current.textContent = m.userData.nama
        } else tip.current.style.opacity = '0'
      }
    }
    const keluar = () => {
      sorot(null)
      if (tip.current) tip.current.style.opacity = '0'
    }
    const tekan = (e) => (turun = { x: e.clientX, y: e.clientY })
    const lepas = (e) => {
      if (!turun || Math.hypot(e.clientX - turun.x, e.clientY - turun.y) > 5) return
      const m = kenai(e)
      if (m && cb.current.bisaKlik(m.userData.id)) cb.current.onPilih?.(m.userData.id)
    }
    renderer.domElement.addEventListener('pointermove', gerak)
    renderer.domElement.addEventListener('pointerleave', keluar)
    renderer.domElement.addEventListener('pointerdown', tekan)
    renderer.domElement.addEventListener('pointerup', lepas)

    // ── Ukuran & render ──
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      kamera.aspect = w / h
      kamera.updateProjectionMatrix()
    })
    ro.observe(el)

    let frame
    const loop = (t) => {
      if (kelompok.scale.z < 1) {
        const p = Math.min(1, (t - mulai) / 900)
        kelompok.scale.z = 0.02 + (1 - (1 - p) ** 3) * 0.98
      }
      kontrol.update()
      renderer.render(scene, kamera)
      frame = requestAnimationFrame(loop)
    }
    mulai = performance.now()
    frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      kontrol.dispose()
      renderer.domElement.removeEventListener('pointermove', gerak)
      renderer.domElement.removeEventListener('pointerleave', keluar)
      renderer.domElement.removeEventListener('pointerdown', tekan)
      renderer.domElement.removeEventListener('pointerup', lepas)
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [geo, nilai, fokus, titik, webgl])

  if (!webgl)
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-soft">
        Peramban ini tidak mendukung WebGL, jadi peta 3D tidak dapat ditampilkan. Gunakan tabel peringkat di bawah.
      </div>
    )

  return (
    <div ref={wadah} className="relative h-full w-full" role="img" aria-label={judulAria}>
      <div
        ref={tip}
        className="pointer-events-none absolute left-0 top-0 z-10 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity"
        aria-hidden="true"
      />
    </div>
  )
}
