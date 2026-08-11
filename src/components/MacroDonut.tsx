import { useApp } from '../state/AppContext'
import type { Targets } from '../lib/nutrition'

interface MacroDonutProps {
  targets: Targets
  size?: number
}

/**
 * Répartition calorique des trois macronutriments. Les arcs sont proportionnels
 * aux calories, pas aux grammes : un gramme de lipide en pèse plus de deux fois
 * un gramme de protéine, la lecture serait trompeuse autrement.
 */
export function MacroDonut({ targets, size = 168 }: MacroDonutProps) {
  const { t } = useApp()

  const total = targets.proteinKcal + targets.carbsKcal + targets.fatKcal
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  // Respiration entre les arcs pour qu'ils ne se touchent jamais.
  const gap = 3

  const segments = [
    { key: 'protein', label: t('macro.protein'), kcal: targets.proteinKcal, color: 'var(--protein)' },
    { key: 'fat', label: t('macro.fat'), kcal: targets.fatKcal, color: 'var(--fat)' },
    { key: 'carbs', label: t('macro.carbs'), kcal: targets.carbsKcal, color: 'var(--carbs)' },
  ].filter((segment) => segment.kcal > 0)

  let offset = 0

  return (
    <div className="donut">
      <div className="donut-chart" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
          role="img"
          aria-label={segments
            .map((s) => `${s.label} ${Math.round((s.kcal / (total || 1)) * 100)} %`)
            .join(', ')}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={stroke}
          />
          {total > 0
            ? segments.map((segment) => {
                const length = (segment.kcal / total) * circumference
                const dash = Math.max(length - gap, 1)
                const node = (
                  <circle
                    key={segment.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    style={{ transition: 'stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease' }}
                  />
                )
                offset += length
                return node
              })
            : null}
        </svg>
        <div className="donut-center">
          <strong>{targets.kcal}</strong>
          <span>kcal</span>
        </div>
      </div>

      <ul className="donut-legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className="dot" style={{ background: segment.color }} />
            {segment.label}
            <em>{Math.round((segment.kcal / (total || 1)) * 100)} %</em>
          </li>
        ))}
      </ul>
    </div>
  )
}
