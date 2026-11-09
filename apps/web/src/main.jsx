import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Lepas layar muat (index.html) setelah aplikasi tampil; ditahan minimal ~1,2 dtk agar animasi logo sempat terlihat.
const muat = document.getElementById('muat')
if (muat) {
  const sisa = Math.max(0, 1200 - performance.now())
  setTimeout(() => {
    muat.classList.add('selesai')
    muat.addEventListener('transitionend', () => muat.remove(), { once: true })
    setTimeout(() => muat.remove(), 900)
  }, sisa)
}
