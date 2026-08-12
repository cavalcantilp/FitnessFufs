import { useState } from 'react'
import { FormPage } from './FormPage'
import { MicroPanel } from './MicroPanel'
import { useApp } from '../state/AppContext'
import { foodName, statesOf } from '../lib/foods'
import { microsFor, nutrientsFor, portionOf } from '../lib/nutrition'
import { MEALS } from '../lib/meals'
import type { TranslationKey } from '../i18n/translations'
import type { Food, FoodState, MealId, PortionKey } from '../lib/types'

interface QuantitySheetProps {
  food: Food
  /** Repas pré-sélectionné ; le sélecteur reste visible pour changer d'avis. */
  meal: MealId
  onConfirm: (grams: number, meal: MealId, state?: FoodState) => void
  onClose: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export function QuantitySheet({ food, meal, onConfirm, onClose, onDelete, onEdit }: QuantitySheetProps) {
  const { t, lang } = useApp()
  const states = statesOf(food)
  const [state, setState] = useState<FoodState | undefined>(food.state)
  const [selectedMeal, setSelectedMeal] = useState<MealId>(meal)

  /**
   * Unité de saisie : les grammes conviennent à la balance, pas au quotidien.
   * « Deux cuillères de skyr » ou « trois biscuits » doivent se saisir tels quels.
   */
  const units = food.portions ?? []
  const [unit, setUnit] = useState<PortionKey | 'g'>('g')
  const gramsPerUnit = unit === 'g' ? 1 : (units.find((entry) => entry.key === unit)?.grams ?? 1)

  const portion = portionOf(food, state)
  const [count, setCount] = useState(String(portion.serving))

  const typed = Number(count.replace(',', '.'))
  const valid = Number.isFinite(typed) && typed > 0
  const amount = valid ? typed * gramsPerUnit : 0
  const preview = nutrientsFor(food, amount, state)

  /**
   * Changer d'état change la nature de ce qu'on pèse : la quantité saisie pour
   * du cru n'a aucun sens pour du cuit, donc on repart de la portion usuelle.
   */
  const switchState = (next: FoodState) => {
    setState(next)
    setCount(String(portionOf(food, next).serving / gramsPerUnit))
  }

  /** Changer d'unité conserve la quantité réelle plutôt que le nombre saisi. */
  const switchUnit = (next: PortionKey | 'g') => {
    const nextGrams = next === 'g' ? 1 : (units.find((entry) => entry.key === next)?.grams ?? 1)
    const converted = amount > 0 ? amount / nextGrams : portion.serving / nextGrams
    setUnit(next)
    setCount(String(Math.round(converted * 100) / 100))
  }

  return (
    <FormPage
      title={foodName(food, lang)}
      subtitle={`${portion.per100.kcal} kcal · ${t('add.per100')}`}
      onBack={onClose}
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
        {/*
          Sans focus automatique : la portion usuelle est déjà pré-remplie, et
          la plupart des ajouts la valident telle quelle. Un focus imposé ici
          ouvrait le clavier — et la bande de saisie automatique de Chrome au-
          dessus, carte bancaire et mot de passe compris — à chaque aliment
          choisi, masquant le bouton de validation pour rien.
        */}
        <div className={units.length > 0 ? 'amount-row' : undefined}>
          <input
            id="grams"
            name="grams"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
          {units.length > 0 ? (
            <select
              value={unit}
              onChange={(event) => switchUnit(event.target.value as PortionKey | 'g')}
              aria-label={t('add.unit')}
            >
              <option value="g">g</option>
              {units.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {t(`portion.${entry.key}` as TranslationKey)} ({entry.grams} g)
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <span className="hint">
          {unit === 'g'
            ? t('add.servingHint', { n: portion.serving })
            : t('add.totalHint', { n: Math.round(amount) })}
        </span>
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

      {/*
        Les calories en tête : c'est le chiffre qu'on surveille en dosant, et
        il ne figurait que sur le bouton de validation, en bas de la feuille.
      */}
      <div className="stat-row five">
        <div className="stat">
          <div className="label">{t('macro.kcal')}</div>
          <div className="value accent">{preview.kcal}</div>
        </div>
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
        <div className="stat">
          <div className="label">{t('macro.fiber')}</div>
          <div className="value">{preview.fiber} g</div>
        </div>
      </div>

      <MicroPanel micros={microsFor(food, valid ? amount : 0)} />

      <button
        type="button"
        className="btn sticky-cta"
        disabled={!valid}
        onClick={() => onConfirm(amount, selectedMeal, states.length > 0 ? state : undefined)}
      >
        {t('add.confirm')} · {preview.kcal} kcal
      </button>

      {onEdit ? (
        <button type="button" className="btn secondary" onClick={onEdit}>
          {t('add.editFood')}
        </button>
      ) : null}

      {onDelete ? (
        <button type="button" className="btn danger" onClick={onDelete}>
          {t('add.deleteFood')}
        </button>
      ) : null}
    </FormPage>
  )
}
