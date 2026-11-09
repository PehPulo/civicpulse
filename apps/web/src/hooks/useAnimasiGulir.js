// Animasi muncul-saat-digulir untuk SEMUA halaman tanpa membungkus tiap elemen: kartu, judul bagian, tabel, dan
// elemen bertanda [data-muncul] di dalam <main> meluncur naik & memudar masuk saat terlihat (berurutan per induk).
// Konten yang dimuat belakangan (data API) ikut ditangkap lewat MutationObserver. Setelah tampil, kelas animasi
// dilepas lagi supaya transform tidak mengganggu peta Leaflet, elemen sticky, atau popup fixed di dalamnya.
// Dilewati bila pengguna memilih kurangi gerak atau browser tidak mendukung IntersectionObserver.
import { useEffect } from 'react'

const PILIH = [
  '.card',
  '.kartu-angkat',
  '[data-muncul]',
  'section h2',
  'section > .container-page > p',
  'table',
  'form',
].join(',')

// Bagian yang sudah punya animasinya sendiri / tidak boleh bergerak.
const LEWATI = '.muncul-awal, [data-tanpa-muncul], .leaflet-container, header, dialog, [role="dialog"]'

export function useAnimasiGulir(kunci) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const akar = document.getElementById('konten-utama')
    if (!akar) return

    const sudah = new WeakSet()
    const io = new IntersectionObserver(
      (entri) => {
        for (const e of entri) {
          if (!e.isIntersecting) continue
          const el = e.target
          io.unobserve(el)
          el.classList.add('gulir-tampil')
          // lepas kelas setelah transisi (jeda + durasi) agar tidak meninggalkan transform
          const jeda = parseInt(el.style.transitionDelay || '0', 10) || 0
          setTimeout(() => {
            el.classList.remove('gulir-awal', 'gulir-tampil')
            el.style.transitionDelay = ''
          }, jeda + 800)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    const pasang = () => {
      const tinggiLayar = window.innerHeight
      const urutanInduk = new Map()
      for (const el of akar.querySelectorAll(PILIH)) {
        if (sudah.has(el)) continue
        sudah.add(el)
        // jangan animasikan elemen di dalam elemen yang sudah dianimasikan / dikecualikan
        if (el.closest(LEWATI) || el.parentElement?.closest('.gulir-awal')) continue
        // yang sudah terlihat di layar saat halaman dibuka tidak perlu dianimasikan ulang
        const kotak = el.getBoundingClientRect()
        if (kotak.top < tinggiLayar * 0.92 && kotak.bottom > 0) continue
        const induk = el.parentElement
        const ke = urutanInduk.get(induk) ?? 0
        urutanInduk.set(induk, ke + 1)
        el.style.transitionDelay = `${Math.min(ke, 5) * 80}ms`
        el.classList.add('gulir-awal')
        io.observe(el)
      }
    }

    pasang()
    let antre = 0
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(antre)
      antre = requestAnimationFrame(pasang)
    })
    mo.observe(akar, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(antre)
      mo.disconnect()
      io.disconnect()
    }
  }, [kunci])
}
