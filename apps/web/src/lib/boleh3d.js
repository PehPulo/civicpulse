// Three.js hanya di desktop (>=1024px, WebGL, tanpa reduced-motion/hemat data). HP memakai latar CSS ringan.
export function boleh3D() {
  if (typeof window === 'undefined') return false
  const m = (q) => window.matchMedia?.(q).matches
  if (!m('(min-width: 1024px)') || m('(prefers-reduced-motion: reduce)') || navigator.connection?.saveData) return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
