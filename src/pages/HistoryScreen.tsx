import { useApp } from '../state/AppContext'
import { FormPage } from '../components/FormPage'
import { IconTrash } from '../components/icons'
import { round1 } from '../lib/nutrition'
import { MEASUREMENT_KEYS } from '../lib/measurements'
import { formatDay } from '../lib/date'
import type { MeasurementKey } from '../lib/types'

interface HistoryScreenProps {
  onBack: () => void
}

/** Une couleur par mesure, pour relier d'un coup d'œil son nom et ses puces dans l'historique. */
const MEASURE_COLOR: Record<MeasurementKey, string> = {
  waist: 'var(--measure-waist)',
  hips: 'var(--measure-hips)',
  chest: 'var(--measure-chest)',
}

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`

/**
 * Historique complet — poids, mesures — à part de l'écran principal : les
 * deux listes mises bout à bout l'alourdissaient, pour un usage de
 * consultation ponctuelle plutôt que quotidien.
 */
export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const { t, lang, weights, removeWeight, measurements, removeMeasurement } = useApp()

  return (
    <FormPage title={t('history.title')} onBack={onBack}>
      <div className="card">
        <div className="card-title">{t('weight.history')}</div>
        {weights.length === 0 ? (
          <p className="hint">{t('weight.empty')}</p>
        ) : (
          [...weights]
            .reverse()
            .map((entry, index, list) => {
              const previous = list[index + 1]
              const delta = previous ? round1(entry.weight - previous.weight) : null
              return (
                <div className="weight-row" key={entry.date}>
                  <span className="date">{formatDay(entry.date, lang)}</span>
                  <span className="kg">{entry.weight} kg</span>
                  <span className="delta">{delta === null ? '' : signed(delta)}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => removeWeight(entry.date)}
                    aria-label={t('common.delete')}
                  >
                    <IconTrash />
                  </button>
                </div>
              )
            })
        )}
      </div>

      <div className="card">
        <div className="card-title">{t('measure.history')}</div>
        {measurements.length === 0 ? (
          <p className="hint">{t('measure.empty')}</p>
        ) : (
          [...measurements]
            .reverse()
            .map((entry) => (
              <div className="measure-row" key={entry.date}>
                <span className="date">{formatDay(entry.date, lang)}</span>
                <span className="measure-chips">
                  {MEASUREMENT_KEYS.filter((key) => entry.values[key] !== undefined).map((key) => (
                    <span className="mval" key={key}>
                      <span className="measure-dot" style={{ background: MEASURE_COLOR[key] }} />
                      {entry.values[key]}
                    </span>
                  ))}
                </span>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() =>
                    MEASUREMENT_KEYS.forEach(
                      (key) => entry.values[key] !== undefined && removeMeasurement(entry.date, key),
                    )
                  }
                  aria-label={t('common.delete')}
                >
                  <IconTrash />
                </button>
              </div>
            ))
        )}
      </div>
    </FormPage>
  )
}
