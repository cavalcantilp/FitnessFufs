import { useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'
import { foodName } from '../lib/foods'
import { nutrientsFor } from '../lib/nutrition'
import { MEALS } from '../lib/meals'
import type { Food, MealId } from '../lib/types'

interface QuantitySheetProps {
  food: Food
  /** Repas pré-sélectionné ; le sélecteur reste visible pour changer d'avis. */
  meal: MealId
  onConfirm: (grams: number, meal: MealId) => void
  onClose: () => void
  onDelete?: () => void
}

export function QuantitySheet({ food, meal, onConfirm, onClose, onDelete }: QuantitySheetProps) {
  const { t, lang } = useApp()
  const [grams, setGrams] = useState(String(food.serving))
  const [selectedMeal, setSelectedMeal] = useState<MealId>(meal)

  const amount = Number(grams.replace(',', '.'))
  const valid = Number.isFinite(amount) && amount > 0
  const preview = nutrientsFor(food, valid ? amount : 0)

  return (
    <Sheet
      title={foodName(food, lang)}
      subtitle={`${food.per100.kcal} kcal · ${t('add.per100')}`}
      onClose={onClose}
    >
      <div className="field">
        <label htmlFor="grams">{t('add.quantity')}</label>
        <input
          id="grams"
          type="number"
          inputMode="decimal"
          min="1"
          value={grams}
          onChange={(event) => setGrams(event.target.value)}
          autoFocus
        />
        <span className="hint">{t('add.servingHint', { n: food.serving })}</span>
      </div>

      <div className="field">
        <label htmlFor="meal">{t('add.meal')}</label>
        <select
          id="meal"
          value={selectedMeal}
          onChange={(event) => setSelectedMeal(event.target.value as MealId)}
        >
          {MEALS.map((entry) => (
            <option key={entry} value={entry}>
              {t(`meal.${entry}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="label">{t('macro.protein')}</div>
          <div className="value">{preview.protein} g</div>
        </div>
        <div className="stat">
          <div className="label">{t('macro.carbs')}</div>
          <div className="value">{preview.carbs} g</div>
        </div>
        <div className="stat">
          <div className="label">{t('macro.fat')}</div>
          <div className="value">{preview.fat} g</div>
        </div>
      </div>

      <button
        type="button"
        className="btn"
        disabled={!valid}
        onClick={() => onConfirm(amount, selectedMeal)}
      >
        {t('add.confirm')} · {preview.kcal} kcal
      </button>

      {onDelete ? (
        <button type="button" className="btn danger" onClick={onDelete}>
          {t('add.deleteFood')}
        </button>
      ) : null}
    </Sheet>
  )
}
