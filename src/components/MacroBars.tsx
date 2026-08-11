import { useApp } from '../state/AppContext'
import type { Nutrients } from '../lib/types'

interface MacroBarsProps {
  eaten: Nutrients
  targets: Nutrients
}

export function MacroBars({ eaten, targets }: MacroBarsProps) {
  const { t } = useApp()

  const rows = [
    { key: 'protein', label: t('macro.protein'), value: eaten.protein, goal: targets.protein, color: 'var(--protein)', limit: false },
    { key: 'carbs', label: t('macro.carbs'), value: eaten.carbs, goal: targets.carbs, color: 'var(--carbs)', limit: false },
    { key: 'fat', label: t('macro.fat'), value: eaten.fat, goal: targets.fat, color: 'var(--fat)', limit: false },
    // Les fibres sont un minimum à atteindre : les dépasser ne se signale pas.
    { key: 'fiber', label: t('macro.fiber'), value: eaten.fiber ?? 0, goal: targets.fiber, color: 'var(--fiber)', limit: true },
  ]

  return (
    <div className="macro-bars">
      {rows.map((row) => {
        const ratio = row.goal > 0 ? Math.min(row.value / row.goal, 1) : 0
        const over = !row.limit && row.goal > 0 && row.value > row.goal
        return (
          <div className="macro-bar" key={row.key}>
            <div className="head">
              <span>{row.label}</span>
            </div>
            <div className="track">
              <div
                className="fill"
                style={{ width: `${ratio * 100}%`, background: over ? 'var(--negative)' : row.color }}
              />
            </div>
            <div className="amount" style={{ color: over ? 'var(--negative)' : undefined }}>
              {Math.round(row.value)} / {row.goal} g
            </div>
          </div>
        )
      })}
    </div>
  )
}
