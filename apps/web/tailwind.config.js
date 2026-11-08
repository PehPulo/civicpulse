/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Lato', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#0f1f2e', soft: '#47586a', faint: '#8494a5' },
        // Hijau gaya portal pemerintahan Jawa Barat (inspirasi gaya, bukan identitas resmi) + aksen kuning.
        brand: {
          50: '#e8f6ee',
          100: '#c7e9d5',
          200: '#9fd8b6',
          300: '#6cc28f',
          400: '#3fb06e',
          500: '#16a75c',
          600: '#069550',
          700: '#047a42',
          800: '#055c34',
          900: '#0a3d24',
        },
        aksen: { 100: '#fff4c2', 300: '#ffe270', 400: '#ffd026', 600: '#d9a900' },
        paper: '#f5f7f6',
        line: '#e1e6e3',
        tinggi: '#c2410c',
        sedang: '#b7791f',
        rendah: '#3f7d4e',
      },
      keyframes: {
        muncul: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'none' } },
        melayang: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        gumpal: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-20px) scale(1.08)' },
          '66%': { transform: 'translate(-20px,15px) scale(0.95)' },
        },
        geser: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        muncul: 'muncul .6s cubic-bezier(.2,.7,.2,1) both',
        melayang: 'melayang 6s ease-in-out infinite',
        gumpal: 'gumpal 14s ease-in-out infinite',
        geser: 'geser 40s linear infinite',
      },
    },
  },
  plugins: [],
}
