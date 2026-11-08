import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Landing from './pages/Landing.jsx'
import Lapor from './pages/Lapor.jsx'
import DetailLaporan from './pages/DetailLaporan.jsx'
import Dasbor from './pages/Dasbor.jsx'
// Sisi warga (Ezra)
import Peta from './pages/Peta.jsx'
import Metodologi from './pages/Metodologi.jsx'
import Lacak from './pages/Lacak.jsx'
import TidakDitemukan from './pages/TidakDitemukan.jsx'
// Sisi instansi / admin (Yance): cukup isi file-nya, rute di sini sudah final
import WajibInstansi from './components/instansi/WajibInstansi.jsx'
import LayoutInstansi from './components/instansi/LayoutInstansi.jsx'
import MasukInstansi from './pages/instansi/Masuk.jsx'
import Ringkasan from './pages/instansi/Ringkasan.jsx'
import Antrean from './pages/instansi/Antrean.jsx'
import PetaTugas from './pages/instansi/PetaTugas.jsx'
import AiPetugas from './pages/instansi/AiPetugas.jsx'
import Profil from './pages/instansi/Profil.jsx'
import TindakLanjut from './pages/instansi/TindakLanjut.jsx'
import Kinerja from './pages/instansi/Kinerja.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const aksiCepatWarga = !pathname.startsWith('/instansi') && pathname !== '/lapor'
  // Panel instansi punya kerangka admin sendiri (bilah atas + sidebar), tanpa navbar & footer situs publik.
  const panelAdmin = pathname.startsWith('/instansi') && pathname !== '/instansi/masuk'

  return (
    <div className={`flex min-h-screen flex-col ${aksiCepatWarga ? 'pb-16 sm:pb-0' : ''}`}>
      <ScrollToTop />
      <a href="#konten-utama" className="skip-link">
        Langsung ke konten
      </a>
      {!panelAdmin && <Navbar />}
      <main id="konten-utama" className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/lapor" element={<Lapor />} />
          <Route path="/laporan/:kode" element={<DetailLaporan />} />
          <Route path="/peta" element={<Peta />} />
          <Route path="/dasbor" element={<Dasbor />} />
          <Route path="/metodologi" element={<Metodologi />} />
          <Route path="/lacak" element={<Lacak />} />

          <Route path="/instansi/masuk" element={<MasukInstansi />} />
          <Route
            path="/instansi"
            element={
              <WajibInstansi>
                <LayoutInstansi />
              </WajibInstansi>
            }
          >
            <Route index element={<Ringkasan />} />
            <Route path="antrean" element={<Antrean />} />
            <Route path="laporan/:kode" element={<TindakLanjut />} />
            <Route path="peta" element={<PetaTugas />} />
            <Route path="kinerja" element={<Kinerja />} />
            <Route path="ai" element={<AiPetugas />} />
            <Route path="profil" element={<Profil />} />
          </Route>

          <Route path="*" element={<TidakDitemukan />} />
        </Routes>
      </main>
      {!panelAdmin && <Footer />}
    </div>
  )
}
