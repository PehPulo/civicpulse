import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Landing from './pages/Landing.jsx'
import Lapor from './pages/Lapor.jsx'
import DetailLaporan from './pages/DetailLaporan.jsx'
import SegeraHadir from './pages/SegeraHadir.jsx'

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
          <Route path="/peta" element={<SegeraHadir judul="Peta Laporan" />} />
          <Route path="/dasbor" element={<SegeraHadir judul="Dasbor Akuntabilitas" />} />
          <Route path="/metodologi" element={<SegeraHadir judul="Metodologi & Data" />} />
          <Route path="*" element={<SegeraHadir judul="Halaman tidak ditemukan" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
