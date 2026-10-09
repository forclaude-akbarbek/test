import { Link } from 'react-router-dom'

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-sky" />
      <path d="M14 40a18 18 0 0 1 36 0" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M10 46h44" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="40" r="6" fill="white" />
    </svg>
  )
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-semibold tracking-tight text-ink">
      <LogoMark />
      <span className="text-[17px]">
        Horizon <span className="text-sky">SAT</span>
      </span>
    </Link>
  )
}
