import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { WeightChart } from '../components/WeightChart'
import { IconTrash } from '../components/icons'
import { bmi, bmiBand, round1 } from '../lib/nutrition'
import { formatDay, shiftDay, todayKey } from '../lib/date'
import type { TranslationKey } from '../i18n/translations'

interface WeightScreenProps {
  onToast: (message: string) => void
}

export function WeightScreen({ onToast }: WeightScreenProps) {
  const { t, lang, weights, logWeight, removeWeight, profile } = useApp()
  const [draft, setDraft] = useState('')

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
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
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
