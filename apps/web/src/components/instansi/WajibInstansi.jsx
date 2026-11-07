// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § Sisi instansi
// Penjaga rute: tanpa sesi instansi ⇒ diarahkan ke /instansi/masuk. Sudah berfungsi; boleh dirapikan.
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../../services/api.js'

export default function WajibInstansi({ children }) {
  const lokasi = useLocation()
  if (!api.sesiInstansi()?.token) return <Navigate to="/instansi/masuk" replace state={{ dari: lokasi.pathname }} />
  return children
}
