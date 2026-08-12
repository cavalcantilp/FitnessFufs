import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { WeightChart } from '../components/WeightChart'
import { IconTrash } from '../components/icons'
import { bmi, bmiBand, round1 } from '../lib/nutrition'
import { MEASUREMENT_KEYS, MEASUREMENT_UNIT, seriesFor } from '../lib/measurements'
import { formatDay, shiftDay, todayKey } from '../lib/date'
import type { TranslationKey } from '../i18n/translations'
import type { MeasurementKey } from '../lib/types'

interface WeightScreenProps {
  onToast: (message: string) => void
}

/** Une couleur par mesure, pour relier d'un coup d'œil son nom et ses puces dans l'historique. */
const MEASURE_COLOR: Record<MeasurementKey, string> = {
  waist: 'var(--measure-waist)',
  hips: 'var(--measure-hips)',
  chest: 'var(--measure-chest)',
}

export function WeightScreen({ onToast }: WeightScreenProps) {
  const { t, lang, weights, logWeight, removeWeight, profile, measurements, logMeasurements, removeMeasurement } =
    useApp()
  const [draft, setDraft] = useState('')
  const [measureDrafts, setMeasureDrafts] = useState<Record<MeasurementKey, string>>({
    waist: '',
    hips: '',
    chest: '',
  })

  const today = todayKey()
  const latest = weights.length ? weights[weights.length - 1] : null
  const first = weights.length ? weights[0] : null
  const current = latest?.weight ?? profile.weight

  const totalDelta = latest && first ? round1(latest.weight - first.weight) : 0
  // Comparaison à la pesée la plus ancienne des sept derniers jours.
  const weekAgoKey = shiftDay(today, -7)
  const recent = weights.filter((entry) => entry.date >= weekAgoKey)
  const weekDelta = latest && recent.length ? round1(latest.weight - recent[0].weight) : 0

  const bmiValue = bmi(current, profile.height)
  const band = bmiBand(bmiValue)

  const submit = () => {
    const value = Number(draft.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    logWeight(today, round1(value))
    setDraft('')
    onToast(t('weight.log'))
  }

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

  const deltaClass = (value: number) => (value < 0 ? ' down' : value > 0 ? ' up' : '')
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`

  return (
    <div className="screen">
      <div className="card stack">
        <div className="card-title">{t('weight.title')}</div>
        <div className="field">
          <label htmlFor="weight-input">{t('weight.input')}</label>
          <input
            id="weight-input"
            name="weight-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={String(current)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
          />
        </div>
        <button type="button" className="btn" onClick={submit} disabled={!draft.trim()}>
          {t('weight.log')}
        </button>
        <p className="hint">{t('weight.syncProfile')}</p>
      </div>

      <div className="card">
        <div className="stat-row">
          <div className="stat">
            <div className="label">{t('weight.current')}</div>
            <div className="value">{current} kg</div>
          </div>
          <div className="stat">
            <div className="label">{t('weight.since')}</div>
            <div className={`value${deltaClass(totalDelta)}`}>{signed(totalDelta)} kg</div>
          </div>
          <div className="stat">
            <div className="label">{t('weight.last7')}</div>
            <div className={`value${deltaClass(weekDelta)}`}>{signed(weekDelta)} kg</div>
          </div>
        </div>
      </div>

      {weights.length >= 2 ? (
        <div className="card">
          <div className="card-title">{t('weight.title')}</div>
          <WeightChart entries={weights} />
        </div>
      ) : null}

      <div className="card">
        <div className="card-title">{t('weight.bmi')}</div>
        <div className="figure-row">
          <span className="name">{t(`bmi.${band}` as TranslationKey)}</span>
          <span className="value">{bmiValue}</span>
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">{t('measure.title')}</div>
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
      </div>

      {measurements.length ? (
        <div className="card stack">
          {MEASUREMENT_KEYS.map((key) => {
            const series = seriesFor(measurements, key)
            if (!series.length) return null
            const latestValue = series[series.length - 1].value
            const delta = series.length > 1 ? round1(latestValue - series[0].value) : 0
            return (
              <div className="figure-row" key={key}>
                <span className="name">
                  <span className="measure-dot" style={{ background: MEASURE_COLOR[key] }} />
                  {t(`measure.${key}` as TranslationKey)}
                </span>
                <span className="value">
                  {latestValue} {MEASUREMENT_UNIT}
                  {series.length > 1 ? (
                    <span className={`measure-delta${deltaClass(delta)}`}> ({signed(delta)})</span>
                  ) : null}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}

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
    </div>
  )
}
