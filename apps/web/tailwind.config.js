/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#0f1f2e', soft: '#47586a', faint: '#8494a5' },
        brand: { 50: '#eaf6f4', 100: '#cdebe6', 500: '#14806f', 600: '#0f6b5c', 700: '#0b5449', 900: '#06302a' },
        paper: '#f7f5f0',
        line: '#e4e1d8',
        tinggi: '#c2410c',
        sedang: '#b7791f',
        rendah: '#3f7d4e',
      },
    },
  },
  plugins: [],
}
