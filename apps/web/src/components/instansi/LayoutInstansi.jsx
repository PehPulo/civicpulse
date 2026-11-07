// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § Sisi instansi
// Kerangka semua halaman instansi: menu samping/atas (Antrean, Kinerja), nama petugas, Keluar, Reset data demo.
// <Outlet /> = tempat halaman anak (Antrean, TindakLanjut, Kinerja) dirender. JANGAN dihapus.
import { Outlet } from 'react-router-dom'

export default function LayoutInstansi() {
  return (
    <div className="container-page py-8">
      <Outlet />
    </div>
  )
}
