import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Landing from './pages/Landing.jsx'
import Lapor from './pages/Lapor.jsx'
import DetailLaporan from './pages/DetailLaporan.jsx'
import Dasbor from './pages/Dasbor.jsx'
// Halaman milik Yance (isi file-nya saja, rute di sini sudah final)
import Peta from './pages/Peta.jsx'
import Metodologi from './pages/Metodologi.jsx'
import Lacak from './pages/Lacak.jsx'
import DataTerbuka from './pages/DataTerbuka.jsx'
import TidakDitemukan from './pages/TidakDitemukan.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/lapor" element={<Lapor />} />
          <Route path="/laporan/:kode" element={<DetailLaporan />} />
          <Route path="/peta" element={<Peta />} />
          <Route path="/dasbor" element={<Dasbor />} />
          <Route path="/metodologi" element={<Metodologi />} />
          <Route path="/lacak" element={<Lacak />} />
          <Route path="/data" element={<DataTerbuka />} />
          <Route path="*" element={<TidakDitemukan />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
