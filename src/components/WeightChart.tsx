import { useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import { daysBetween, formatShort } from '../lib/date'
import type { WeightEntry } from '../lib/types'

interface WeightChartProps {
  /** Pesées triées par date croissante. */
  entries: WeightEntry[]
}

const WIDTH = 320
const HEIGHT = 150
// Une bande libre en haut accueille la valeur mise en avant, hors de la courbe.
const PAD = { top: 26, right: 34, bottom: 20, left: 8 }

/**
 * Série unique poids/temps : une ligne suffit, sans légende (le titre de la carte
 * nomme la série). L'axe des abscisses respecte les dates réelles, donc un trou
 * de deux semaines se voit comme un trou.
 */
export function WeightChart({ entries }: WeightChartProps) {
  const { lang } = useApp()
  const [active, setActive] = useState<number | null>(null)

  const model = useMemo(() => {
    if (entries.length < 2) return null

    const first = entries[0].date
    const span = Math.max(daysBetween(first, entries[entries.length - 1].date), 1)
    const values = entries.map((entry) => entry.weight)
    const min = Math.min(...values)
    const max = Math.max(...values)
    // Marge d'un demi-kilo pour éviter une courbe collée aux bords.
    const low = Math.floor((min - 0.5) * 2) / 2
    const high = Math.ceil((max + 0.5) * 2) / 2
    const range = high - low || 1

    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom

    const points = entries.map((entry) => ({
      entry,
      x: PAD.left + (daysBetween(first, entry.date) / span) * innerW,
      y: PAD.top + (1 - (entry.weight - low) / range) * innerH,
    }))

    return { points, low, high, innerW, innerH }
  }, [entries])

  if (!model) return null

  const { points, low, high } = model
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')
  const areaPath = `${path} L${points[points.length - 1].x} ${HEIGHT - PAD.bottom} L${points[0].x} ${HEIGHT - PAD.bottom} Z`
  const last = points[points.length - 1]
  const focused = active !== null ? points[active] : null
  // Au-delà de deux semaines de points, les marqueurs se chevauchent : on ne
  // garde que le dernier, plus celui survolé.
  const showMarkers = points.length <= 14

  const nearest = (clientX: number, target: SVGSVGElement) => {
    const box = target.getBoundingClientRect()
    const x = ((clientX - box.left) / box.width) * WIDTH
    let best = 0
    points.forEach((point, index) => {
      if (Math.abs(point.x - x) < Math.abs(points[best].x - x)) best = index
    })
    return best
  }

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${entries[0].weight} kg → ${entries[entries.length - 1].weight} kg`}
      onPointerMove={(event) => setActive(nearest(event.clientX, event.currentTarget))}
      onPointerLeave={() => setActive(null)}
    >
      <defs>
        <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Repères haut / bas seulement : la grille reste en retrait de la donnée. */}
      {[high, low].map((value, index) => {
        const y = PAD.top + index * (HEIGHT - PAD.top - PAD.bottom)
        return (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y}
              y2={y}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeWidth="1"
            />
            <text
              x={WIDTH - PAD.right + 5}
              y={y + 3}
              fill="var(--text-sub)"
              fontSize="9"
              fontWeight="600"
            >
              {value}
            </text>
          </g>
        )
      })}

      <path d={areaPath} fill="url(#weight-fill)" />
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showMarkers
        ? points.map((point) => (
            <circle
              key={point.entry.date}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="var(--accent)"
              stroke="var(--card-bg)"
              strokeWidth="2"
            />
          ))
        : null}

      {/* Dernière valeur libellée en direct plutôt qu'un nombre sur chaque point. */}
      <circle cx={last.x} cy={last.y} r="4.5" fill="var(--accent)" stroke="var(--card-bg)" strokeWidth="2" />

      {focused && focused !== last ? (
        <>
          <line
            x1={focused.x}
            x2={focused.x}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth="1"
          />
          <circle
            cx={focused.x}
            cy={focused.y}
            r="4.5"
            fill="var(--accent)"
            stroke="var(--card-bg)"
            strokeWidth="2"
          />
        </>
      ) : null}

      <text
        x={PAD.left}
        y={HEIGHT - 6}
        fill="var(--text-sub)"
        fontSize="9"
        fontWeight="600"
      >
        {formatShort(entries[0].date, lang)}
      </text>
      <text
        x={WIDTH - PAD.right}
        y={HEIGHT - 6}
        textAnchor="end"
        fill="var(--text-sub)"
        fontSize="9"
        fontWeight="600"
      >
        {formatShort((focused ?? last).entry.date, lang)}
      </text>
      {/* Valeur mise en avant à gauche : les graduations occupent déjà la marge droite. */}
      <text x={PAD.left} y={13} fill="var(--text-main)" fontSize="11" fontWeight="700">
        {(focused ?? last).entry.weight} kg
      </text>
    </svg>
  )
}
