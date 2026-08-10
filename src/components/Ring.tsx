interface RingProps {
  /** Valeur consommée. */
  value: number
  /** Objectif. Un objectif nul rend l'anneau vide. */
  goal: number
  /** Libellé sous le grand chiffre. */
  caption: string
  size?: number
}

/**
 * Anneau de progression calorique. Au-delà de l'objectif l'anneau reste plein
 * et bascule en rouge : le dépassement se lit d'un coup d'œil.
 */
export function Ring({ value, goal, caption, size = 116 }: RingProps) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0
  const over = goal > 0 && value > goal
  const remaining = Math.round(goal - value)
  const color = over ? 'var(--negative)' : 'var(--accent)'

  return (
    <div style={{ width: size, height: size, position: 'relative', flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <strong
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: over ? 'var(--negative)' : 'var(--text-main)',
          }}
        >
          {Math.abs(remaining)}
        </strong>
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-sub)',
          }}
        >
          {caption}
        </span>
      </div>
    </div>
  )
}
