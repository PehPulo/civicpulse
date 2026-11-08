// Animasi ringan untuk situs warga: muncul saat digulir & angka berjalan. Hormati prefers-reduced-motion.
import { useEffect, useRef, useState } from 'react'

const gerakDikurangi = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useTerlihat(sekali = true) {
  const ref = useRef(null)
  const [terlihat, setTerlihat] = useState(() => gerakDikurangi() || typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (terlihat && sekali) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTerlihat(true)
          if (sekali) io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [terlihat, sekali])
  return [ref, terlihat]
}

/** Bungkus elemen agar meluncur naik & memudar masuk saat terlihat. `jeda` dalam ms untuk efek berurutan. */
export default function Muncul({ as: Tag = 'div', jeda = 0, className = '', children, ...props }) {
  const [ref, terlihat] = useTerlihat()
  return (
    <Tag
      ref={ref}
      className={`muncul-awal ${terlihat ? 'muncul-tampil' : ''} ${className}`}
      style={{ transitionDelay: terlihat ? `${jeda}ms` : '0ms' }}
      {...props}
    >
      {children}
    </Tag>
  )
}

/** Angka berjalan dari 0 ke `nilai` saat terlihat (nilai non-angka ditampilkan apa adanya). */
export function AngkaBerjalan({ nilai, durasi = 1200, className = '' }) {
  const [ref, terlihat] = useTerlihat()
  const target = Number(String(nilai).replace(/\./g, '').replace(',', '.'))
  const angka = Number.isFinite(target)
  const [tampil, setTampil] = useState(angka && !gerakDikurangi() ? 0 : target)

  useEffect(() => {
    if (!terlihat || !angka) return
    if (gerakDikurangi()) return setTampil(target)
    let frame
    const mulai = performance.now()
    const jalan = (t) => {
      const p = Math.min(1, (t - mulai) / durasi)
      setTampil(target * (1 - (1 - p) ** 3))
      if (p < 1) frame = requestAnimationFrame(jalan)
    }
    frame = requestAnimationFrame(jalan)
    return () => cancelAnimationFrame(frame)
  }, [terlihat, target, angka, durasi])

  const desimal = angka && !Number.isInteger(target) ? 1 : 0
  return (
    <span ref={ref} className={className}>
      {angka
        ? tampil.toLocaleString('id-ID', { maximumFractionDigits: desimal, minimumFractionDigits: desimal })
        : nilai}
    </span>
  )
}
