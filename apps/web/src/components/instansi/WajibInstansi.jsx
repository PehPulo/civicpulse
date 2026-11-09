// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § Sisi instansi
// Penjaga rute: tanpa sesi instansi ⇒ diarahkan ke /instansi/masuk.
// Token ditolak server (401, mis. kedaluwarsa 8 jam) ⇒ sesi dihapus (identitas.sesiHabis) dan langsung diarahkan
// ke halaman masuk dengan pesan "sesi berakhir", bukan tetap di panel dengan galat token.
import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../../services/api.js'
import { EVENT_SESI_HABIS } from '../../services/identitas.js'

export default function WajibInstansi({ children }) {
  const lokasi = useLocation()
  const [habis, setHabis] = useState(false)
  useEffect(() => {
    const tandai = () => setHabis(true)
    window.addEventListener(EVENT_SESI_HABIS, tandai)
    return () => window.removeEventListener(EVENT_SESI_HABIS, tandai)
  }, [])
  if (!api.sesiInstansi()?.token)
    return <Navigate to="/instansi/masuk" replace state={{ dari: lokasi.pathname, habis }} />
  return children
}
