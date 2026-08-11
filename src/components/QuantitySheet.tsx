import { useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'
import { foodName, statesOf } from '../lib/foods'
import { nutrientsFor, portionOf } from '../lib/nutrition'
import { MEALS } from '../lib/meals'
import type { Food, FoodState, MealId } from '../lib/types'

interface QuantitySheetProps {
  food: Food
  /** Repas pré-sélectionné ; le sélecteur reste visible pour changer d'avis. */
  meal: MealId
  onConfirm: (grams: number, meal: MealId, state?: FoodState) => void
  onClose: () => void
  onDelete?: () => void
}

export function QuantitySheet({ food, meal, onConfirm, onClose, onDelete }: QuantitySheetProps) {
  const { t, lang } = useApp()
  const states = statesOf(food)
  const [state, setState] = useState<FoodState | undefined>(food.state)
  const [grams, setGrams] = useState(String(food.serving))
  const [selectedMeal, setSelectedMeal] = useState<MealId>(meal)

  const portion = portionOf(food, state)
  const amount = Number(grams.replace(',', '.'))
  const valid = Number.isFinite(amount) && amount > 0
  const preview = nutrientsFor(food, valid ? amount : 0, state)

  /**
   * Changer d'état change la nature de ce qu'on pèse : la quantité saisie pour
   * du cru n'a aucun sens pour du cuit, donc on repart de la portion usuelle.
   */
  const switchState = (next: FoodState) => {
    setState(next)
    setGrams(String(portionOf(food, next).serving))
  }

  return (
    <Sheet
      title={foodName(food, lang)}
      subtitle={`${portion.per100.kcal} kcal · ${t('add.per100')}`}
      onClose={onClose}
    >
      {states.length > 0 ? (
        <div className="field">
          <label>{t('state.title')}</label>
          <div className="segmented">
            {states.map((entry) => (
              <button
                key={entry}
                type="button"
                className={state === entry ? 'active' : ''}
                onClick={() => switchState(entry)}
              >
                {t(entry === 'raw' ? 'state.raw' : 'state.cooked')}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="grams">{t('add.quantity')}</label>
        <input
          id="grams"
          type="text"
          inputMode="decimal"
          value={grams}
          onChange={(event) => setGrams(event.target.value)}
          autoFocus
        />
        <span className="hint">{t('add.servingHint', { n: portion.serving })}</span>
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
        onClick={() => onConfirm(amount, selectedMeal, states.length > 0 ? state : undefined)}
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
