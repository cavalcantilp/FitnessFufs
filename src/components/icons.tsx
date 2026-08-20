type IconProps = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function IconDiary({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export function IconPlus({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconScale({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 11a4 4 0 0 1 8 0" />
      <path d="M12 11 10 8" />
    </svg>
  )
}

export function IconUser({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  )
}

export function IconFridge({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 9h14" />
      <path d="M8 4.5v2M8 11.5v2" />
    </svg>
  )
}

export function IconChevronLeft({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function IconChevronRight({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function IconChevronDown({ size = 18, open = false }: IconProps & { open?: boolean }) {
  return (
    <svg
      {...base(size)}
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconCalendar({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconBarcode({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M3 7V5a1 1 0 0 1 1-1h2M21 7V5a1 1 0 0 0-1-1h-2M3 17v2a1 1 0 0 0 1 1h2M21 17v2a1 1 0 0 1-1 1h-2" />
      <path d="M7 8v8M10.5 8v8M14 8v8M17 8v8" />
    </svg>
  )
}

export function IconChat({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z" />
      <path d="M8 9h8M8 12.5h5" />
    </svg>
  )
}

export function IconSend({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M3 11.5 20 4l-6.5 17-3-7-7.5-2.5Z" />
    </svg>
  )
}

export function IconTrash({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
    </svg>
  )
}

export function IconStar({ size = 18, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
    </svg>
  )
}

export function IconClose({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconCopy({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

export function IconFlame({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)} aria-hidden="true">
      <path d="M12 22c4.4 0 7-2.7 7-6.5 0-3-2-5-3.3-7C15 10 14 11.3 14 11.3 14.4 8 13 4 9.8 2c.6 3 -.3 5-2 7-1.6 2-2.8 3.7-2.8 6.5C5 19.3 7.6 22 12 22Z" />
    </svg>
  )
}

export function IconComment({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.4 3.3A1 1 0 0 1 3 19.5V5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

export function Logo({ size = 84 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r="46" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
      <path
        d="M24 48h9l6-15 9 30 8-22 5 7h11"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
