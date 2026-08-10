import { useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'
import { kcalFromMacros } from '../lib/nutrition'
import { FOOD_CATEGORIES } from '../lib/foods'
import type { Food, FoodCategory } from '../lib/types'
import type { TranslationKey } from '../i18n/translations'

interface CustomFoodSheetProps {
  /** Nom pré-rempli depuis la recherche en cours. */
  initialName?: string
  onCreated: (food: Food) => void
  onClose: () => void
}

export function CustomFoodSheet({ initialName = '', onCreated, onClose }: CustomFoodSheetProps) {
  const { t, addCustomFood } = useApp()
  const [name, setName] = useState(initialName)
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [serving, setServing] = useState('100')
  const [category, setCategory] = useState<FoodCategory>('dish')

  const num = (value: string) => {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  const derivedKcal = kcalFromMacros(num(protein), num(carbs), num(fat))
  // Les calories saisies priment ; à défaut on les reconstitue depuis les macros.
  const finalKcal = kcal.trim() ? Math.round(num(kcal)) : derivedKcal
  const valid = name.trim().length > 0 && finalKcal > 0

  const submit = () => {
    if (!valid) return
    const created = addCustomFood({
      name: name.trim(),
      per100: {
        kcal: finalKcal,
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
      },
      serving: Math.max(1, Math.round(num(serving)) || 100),
      category,
    })
    onCreated(created)
  }

  return (
    <Sheet title={t('add.custom')} subtitle={t('add.customHint')} onClose={onClose}>
      <div className="field">
        <label htmlFor="cf-name">{t('add.customName')}</label>
        <input
          id="cf-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="cf-kcal">{t('macro.kcal')}</label>
          <input
            id="cf-kcal"
            type="number"
            inputMode="decimal"
            min="0"
            value={kcal}
            onChange={(event) => setKcal(event.target.value)}
            placeholder={String(derivedKcal)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-serving">{t('add.quantity')}</label>
          <input
            id="cf-serving"
            type="number"
            inputMode="numeric"
            min="1"
            value={serving}
            onChange={(event) => setServing(event.target.value)}
          />
        </div>
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="cf-p">{t('macro.protein')}</label>
          <input
            id="cf-p"
            type="number"
            inputMode="decimal"
            min="0"
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-c">{t('macro.carbs')}</label>
          <input
            id="cf-c"
            type="number"
            inputMode="decimal"
            min="0"
            value={carbs}
            onChange={(event) => setCarbs(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cf-f">{t('macro.fat')}</label>
          <input
            id="cf-f"
            type="number"
            inputMode="decimal"
            min="0"
            value={fat}
            onChange={(event) => setFat(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="cf-cat">{t('cat.all')}</label>
        <select
          id="cf-cat"
          value={category}
          onChange={(event) => setCategory(event.target.value as FoodCategory)}
        >
          {FOOD_CATEGORIES.map((entry) => (
            <option key={entry} value={entry}>
              {t(`cat.${entry}` as TranslationKey)}
            </option>
          ))}
        </select>
      </div>

      {!kcal.trim() && derivedKcal > 0 ? (
        <p className="hint">{t('add.kcalMismatch', { n: derivedKcal })}</p>
      ) : null}

      <button type="button" className="btn" disabled={!valid} onClick={submit}>
        {t('common.save')}
      </button>
    </Sheet>
  )
}
