export default function Logo({ terang = false }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={terang ? '#ffffff' : '#069550'} />
        <path
          d="M5 17h5l3-7 5 13 3-6h6"
          fill="none"
          stroke={terang ? '#069550' : '#ffffff'}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`text-lg font-extrabold tracking-tight ${terang ? 'text-white' : 'text-ink'}`}>
        Civic<span className={terang ? 'text-brand-100' : 'text-brand-600'}>Pulse</span>
      </span>
    </span>
  )
}
