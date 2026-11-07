import { useCallback, useEffect, useState } from 'react'
import { onBerubah } from '../services/api.js'

/**
 * Ambil data dari services/api dengan state loading/error, dan muat ulang otomatis setelah ada mutasi.
 * @example const { data, loading, error } = useApi(() => api.getLaporan(kode), [kode])
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const muat = useCallback(fn, deps)

  useEffect(() => {
    let aktif = true
    const jalankan = () =>
      muat().then(
        (data) => aktif && setState({ data, loading: false, error: null }),
        (error) => aktif && setState({ data: null, loading: false, error }),
      )
    jalankan()
    const lepas = onBerubah(jalankan)
    return () => {
      aktif = false
      lepas()
    }
  }, [muat])

  return state
}

/** Jalankan mutasi (POST) dengan state proses & galat. */
export function useAksi(fn) {
  const [state, setState] = useState({ proses: false, error: null })
  const jalankan = useCallback(
    async (...args) => {
      setState({ proses: true, error: null })
      try {
        const hasil = await fn(...args)
        setState({ proses: false, error: null })
        return hasil
      } catch (error) {
        setState({ proses: false, error })
        return undefined
      }
    },
    [fn],
  )
  return [jalankan, state]
}
