import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { LineChart } from '../components/LineChart'
import { BmiGauge } from '../components/BmiGauge'
import { AddWeightSheet } from '../components/AddWeightSheet'
import { HistoryScreen } from './HistoryScreen'
import { IconChevronDown, IconPlus } from '../components/icons'
import { bmi, round1 } from '../lib/nutrition'
import { MEASUREMENT_KEYS, MEASUREMENT_UNIT, seriesFor } from '../lib/measurements'
import { todayKey } from '../lib/date'
import type { TranslationKey } from '../i18n/translations'
import type { MeasurementKey } from '../lib/types'

interface WeightScreenProps {
  onToast: (message: string) => void
}

/** Une couleur par mesure, pour relier d'un coup d'œil son nom, ses puces et son graphique. */
const MEASURE_COLOR: Record<MeasurementKey, string> = {
  waist: 'var(--measure-waist)',
  hips: 'var(--measure-hips)',
  chest: 'var(--measure-chest)',
}

export function WeightScreen({ onToast }: WeightScreenProps) {
  const { t, weights, profile, measurements, logMeasurements } = useApp()

  const [showHistory, setShowHistory] = useState(false)
  const [addWeightOpen, setAddWeightOpen] = useState(false)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [measureDrafts, setMeasureDrafts] = useState<Record<MeasurementKey, string>>({
    waist: '',
    hips: '',
    chest: '',
  })

  if (showHistory) return <HistoryScreen onBack={() => setShowHistory(false)} />

  const today = todayKey()
  const latest = weights.length ? weights[weights.length - 1] : null
  const current = latest?.weight ?? profile.weight

  const bmiValue = bmi(current, profile.height)

  const hasMeasureDraft = MEASUREMENT_KEYS.some((key) => measureDrafts[key].trim() !== '')

  /** On ne mesure pas forcément tout le même jour : seuls les champs remplis sont enregistrés. */
  const submitMeasurements = () => {
    const values: Partial<Record<MeasurementKey, number>> = {}
    for (const key of MEASUREMENT_KEYS) {
      const raw = measureDrafts[key].trim()
      if (!raw) continue
      const value = Number(raw.replace(',', '.'))
      if (Number.isFinite(value) && value > 0) values[key] = round1(value)
    }
    if (Object.keys(values).length === 0) return
    logMeasurements(today, values)
    setMeasureDrafts({ waist: '', hips: '', chest: '' })
    onToast(t('measure.logged'))
  }

  return (
    <div className="screen">
      <div className="track-hero">
        <div className="card track-chart">
          <div className="card-title">{t('weight.trend')}</div>
          {weights.length ? (
            <LineChart
              points={weights.map((entry) => ({ date: entry.date, value: entry.weight }))}
              unit="kg"
              color="var(--accent)"
            />
          ) : (
            <p className="hint">{t('weight.empty')}</p>
          )}
        </div>

        <div className="card track-results stack">
          <BmiGauge value={bmiValue} />

          {measurements.length
            ? MEASUREMENT_KEYS.map((key) => {
                const series = seriesFor(measurements, key)
                if (!series.length) return null
                const latestValue = series[series.length - 1].value
                return (
                  <div className="figure-row" key={key}>
                    <span className="name">
                      <span className="measure-dot" style={{ background: MEASURE_COLOR[key] }} />
                      {t(`measure.${key}` as TranslationKey)}
                    </span>
                    <span className="value">
                      {latestValue} {MEASUREMENT_UNIT}
                    </span>
                  </div>
                )
              })
            : null}

          <button
            type="button"
            className="icon-btn track-add"
            onClick={() => setAddWeightOpen(true)}
            aria-label={t('weight.log')}
          >
            <IconPlus size={14} />
          </button>
        </div>
      </div>

      {addWeightOpen ? (
        <AddWeightSheet
          onClose={() => setAddWeightOpen(false)}
          onLogged={() => {
            setAddWeightOpen(false)
            onToast(t('weight.log'))
          }}
        />
      ) : null}

      <div className="disclosure">
        <button
          type="button"
          className="disclosure-head"
          onClick={() => setMeasureOpen((value) => !value)}
          aria-expanded={measureOpen}
        >
          <span>{t('measure.title')}</span>
          <IconChevronDown open={measureOpen} />
        </button>

        {measureOpen ? (
          <div className="disclosure-body stack">
            <div className="grid-3">
              {MEASUREMENT_KEYS.map((key) => (
                <div className="field" key={key}>
                  <label htmlFor={`m-${key}`}>
                    {t(`measure.${key}` as TranslationKey)} ({MEASUREMENT_UNIT})
                  </label>
                  <input
                    id={`m-${key}`}
                    name={`m-${key}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={measureDrafts[key]}
                    onChange={(event) =>
                      setMeasureDrafts((current) => ({ ...current, [key]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <button type="button" className="btn" onClick={submitMeasurements} disabled={!hasMeasureDraft}>
              {t('measure.log')}
            </button>

            {MEASUREMENT_KEYS.map((key) => {
              const series = seriesFor(measurements, key)
              if (series.length < 2) return null
              return (
                <div className="track-measure-chart" key={key}>
                  <div className="figure-row">
                    <span className="name">
                      <span className="measure-dot" style={{ background: MEASURE_COLOR[key] }} />
                      {t(`measure.${key}` as TranslationKey)}
                    </span>
                  </div>
                  <LineChart points={series} unit={MEASUREMENT_UNIT} color={MEASURE_COLOR[key]} />
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      <button type="button" className="btn secondary" onClick={() => setShowHistory(true)}>
        {t('history.open')}
      </button>
    </div>
  )
}
