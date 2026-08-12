import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { WeightChart } from '../components/WeightChart'
import { HistoryScreen } from './HistoryScreen'
import { IconChevronDown } from '../components/icons'
import { bmi, bmiBand, round1 } from '../lib/nutrition'
import { MEASUREMENT_KEYS, MEASUREMENT_UNIT, seriesFor } from '../lib/measurements'
import { todayKey } from '../lib/date'
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
  const {
    t,
    weights,
    logWeight,
    profile,
    measurements,
    logMeasurements,
    bodyFat,
    logBodyFat,
  } = useApp()

  const [showHistory, setShowHistory] = useState(false)
  const [draft, setDraft] = useState('')
  const [measureOpen, setMeasureOpen] = useState(false)
  const [measureDrafts, setMeasureDrafts] = useState<Record<MeasurementKey, string>>({
    waist: '',
    hips: '',
    chest: '',
  })
  const [bodyFatOpen, setBodyFatOpen] = useState(false)
  const [bodyFatDraft, setBodyFatDraft] = useState('')

  if (showHistory) return <HistoryScreen onBack={() => setShowHistory(false)} />

  const today = todayKey()
  const latest = weights.length ? weights[weights.length - 1] : null
  const current = latest?.weight ?? profile.weight

  const bmiValue = bmi(current, profile.height)
  const band = bmiBand(bmiValue)

  const latestBodyFat = bodyFat.length ? bodyFat[bodyFat.length - 1] : null
  const bodyFatDelta =
    bodyFat.length > 1 ? round1(bodyFat[bodyFat.length - 1].percent - bodyFat[0].percent) : null

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

  const submitBodyFat = () => {
    const value = Number(bodyFatDraft.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0 || value >= 100) return
    logBodyFat(today, round1(value))
    setBodyFatDraft('')
    onToast(t('bodyfat.logged'))
  }

  const deltaClass = (value: number) => (value < 0 ? ' down' : value > 0 ? ' up' : '')
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`

  return (
    <div className="screen">
      {/* Les trois résultats qu'on vient chercher en premier, mis en avant
          plutôt que noyés parmi les cartes de saisie. */}
      <div className="macro-grid">
        <div className="macro-card">
          <div className="macro-title">{t('weight.current')}</div>
          <div className="macro-value">{current} kg</div>
        </div>
        <div className="macro-card">
          <div className="macro-title">{t('weight.bmi')}</div>
          <div className="macro-value">{bmiValue}</div>
          <div className="macro-sub">{t(`bmi.${band}` as TranslationKey)}</div>
        </div>
        {latestBodyFat ? (
          <div className="macro-card">
            <div className="macro-title">{t('bodyfat.title')}</div>
            <div className="macro-value">{latestBodyFat.percent} %</div>
            {bodyFatDelta !== null ? (
              <div className={`macro-sub${deltaClass(bodyFatDelta)}`}>{signed(bodyFatDelta)} %</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <button type="button" className="btn secondary" onClick={() => setShowHistory(true)}>
        {t('history.open')}
      </button>

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

      {weights.length >= 2 ? (
        <div className="card">
          <div className="card-title">{t('weight.title')}</div>
          <WeightChart entries={weights} />
        </div>
      ) : null}

      {measurements.length ? (
        <div className="card stack">
          <div className="card-title">{t('measure.title')}</div>
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
          </div>
        ) : null}
      </div>

      <div className="disclosure">
        <button
          type="button"
          className="disclosure-head"
          onClick={() => setBodyFatOpen((value) => !value)}
          aria-expanded={bodyFatOpen}
        >
          <span>{t('bodyfat.title')}</span>
          <IconChevronDown open={bodyFatOpen} />
        </button>

        {bodyFatOpen ? (
          <div className="disclosure-body stack">
            <div className="field">
              <label htmlFor="bodyfat-input">{t('bodyfat.input')} (%)</label>
              <input
                id="bodyfat-input"
                name="bodyfat-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={bodyFatDraft}
                onChange={(event) => setBodyFatDraft(event.target.value)}
                placeholder={latestBodyFat ? String(latestBodyFat.percent) : undefined}
              />
            </div>
            <button type="button" className="btn" onClick={submitBodyFat} disabled={!bodyFatDraft.trim()}>
              {t('bodyfat.log')}
            </button>
            <p className="hint">{t('bodyfat.hint')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
