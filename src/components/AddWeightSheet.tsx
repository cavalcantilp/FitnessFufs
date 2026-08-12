import { useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'
import { round1 } from '../lib/nutrition'
import { todayKey } from '../lib/date'

interface AddWeightSheetProps {
  onClose: () => void
  onLogged: () => void
}

/** Pop-up minimal pour une seule pesée : pas de quoi justifier une page entière. */
export function AddWeightSheet({ onClose, onLogged }: AddWeightSheetProps) {
  const { t, logWeight, weights, profile } = useApp()
  const latest = weights.length ? weights[weights.length - 1] : null
  const current = latest?.weight ?? profile.weight
  const [draft, setDraft] = useState('')

  const submit = () => {
    const value = Number(draft.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    logWeight(todayKey(), round1(value))
    onLogged()
  }

  return (
    <Sheet title={t('weight.log')} onClose={onClose}>
      <div className="field">
        <label htmlFor="weight-quick-input">{t('weight.input')}</label>
        <input
          id="weight-quick-input"
          name="weight-quick-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={String(current)}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit()
          }}
        />
      </div>
      <button type="button" className="btn" onClick={submit} disabled={!draft.trim()}>
        {t('weight.log')}
      </button>
    </Sheet>
  )
}
