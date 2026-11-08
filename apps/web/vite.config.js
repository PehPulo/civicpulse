import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // .env dibaca dari akar repo (lihat .env.example). Hanya variabel VITE_* yang masuk ke browser,
  // jadi GROQ_API_KEY di file yang sama TIDAK pernah ikut ter-bundle.
  envDir: '../..',
})
