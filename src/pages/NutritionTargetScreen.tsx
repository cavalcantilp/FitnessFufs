import { useMemo, useState } from 'react'
import { FormPage } from '../components/FormPage'
import { useApp } from '../state/AppContext'
import { FOOD_CATEGORIES, foodName, statesOf } from '../lib/foods'
import { nutrientsFor, portionOf } from '../lib/nutrition'
import type { TranslationKey } from '../i18n/translations'
import type { Food, FoodCategory, FoodState, MealId, Nutrients } from '../lib/types'

interface NutritionTargetScreenProps {
  date: string
  meal: MealId
  onBack: () => void
  onAdded: (message: string) => void
  onLogged: () => void
}

type TargetNutrient = 'kcal' | 'protein' | 'carbs' | 'fat'

const TARGET_NUTRIENTS: TargetNutrient[] = ['kcal', 'protein', 'carbs', 'fat']

interface TargetRow {
  food: Food
  state: FoodState | undefined
  grams: number
  nutrients: Nutrients
}

/**
 * Grammes nécessaires d'un aliment (dans l'état donné) pour atteindre une
 * quantité cible d'un nutriment. `null` si l'aliment n'apporte pas ce
 * nutriment — comparer des grammes infinis n'a pas de sens.
 */
function gramsFor(food: Food, state: FoodState | undefined, nutrient: TargetNutrient, target: number): number | null {
  const per100 = portionOf(food, state).per100[nutrient]
  if (!per100 || per100 <= 0) return null
  const grams = Math.round((target * 100) / per100)
  return grams > 0 ? grams : null
}

export function NutritionTargetScreen({ date, meal, onBack, onAdded, onLogged }: NutritionTargetScreenProps) {
  const { t, lang, foods, addEntry } = useApp()
  const [category, setCategory] = useState<FoodCategory | 'all'>('protein')
  const [nutrient, setNutrient] = useState<TargetNutrient>('protein')
  const [quantity, setQuantity] = useState('100')

  const target = Number(quantity.replace(',', '.'))
  const hasTarget = Number.isFinite(target) && target > 0

  const rows = useMemo(() => {
    if (!hasTarget) return []
    const pool = category === 'all' ? foods : foods.filter((food) => food.category === category)

    // Un même aliment (cru + cuit) reste groupé, trié par le meilleur de ses
    // deux états : comparer 435 g de blanc de poulet cru à 323 g cuit côte à
    // côte n'a de sens que si les deux restent voisins dans la liste.
    const groups = pool
      .map((food) => {
        const states = statesOf(food)
        const stateList: (FoodState | undefined)[] = states.length ? states : [undefined]
        const entries = stateList.reduce<TargetRow[]>((acc, state) => {
          const grams = gramsFor(food, state, nutrient, target)
          if (grams === null) return acc
          acc.push({ food, state, grams, nutrients: nutrientsFor(food, grams, state) })
          return acc
        }, [])
        return entries
      })
      .filter((entries) => entries.length > 0)

    groups.sort((a, b) => Math.min(...a.map((entry) => entry.grams)) - Math.min(...b.map((entry) => entry.grams)))
    return groups.flat()
  }, [foods, category, nutrient, target, hasTarget])

  const logRow = (row: TargetRow) => {
    addEntry(date, meal, row.food, row.grams, row.state)
    onAdded(t('add.added'))
    onLogged()
  }

  return (
    <FormPage title={t('target.title')} subtitle={t('target.subtitle')} onBack={onBack}>
      <div className="field">
        <label htmlFor="target-category">{t('target.category')}</label>
        <select id="target-category" value={category} onChange={(event) => setCategory(event.target.value as FoodCategory | 'all')}>
          <option value="all">{t('cat.all')}</option>
          {FOOD_CATEGORIES.map((entry) => (
            <option key={entry} value={entry}>
              {t(`cat.${entry}` as TranslationKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="target-nutrient">{t('target.nutrient')}</label>
          <select id="target-nutrient" value={nutrient} onChange={(event) => setNutrient(event.target.value as TargetNutrient)}>
            {TARGET_NUTRIENTS.map((entry) => (
              <option key={entry} value={entry}>
                {t(`macro.${entry}` as TranslationKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="target-quantity">
            {t('target.quantity')} ({nutrient === 'kcal' ? 'kcal' : 'g'})
          </label>
          <input
            id="target-quantity"
            name="target-quantity"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
      </div>

      {hasTarget ? (
        <div className="notice info">
          {t('target.goal', {
            qty: String(target),
            unit: nutrient === 'kcal' ? 'kcal' : 'g',
            nutrient: t(`macro.${nutrient}` as TranslationKey),
          })}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="hint">{t('target.empty')}</p>
      ) : (
        <div className="stack">
          {rows.map((row) => (
            <button
              type="button"
              className="card target-result"
              key={`${row.food.id}-${row.state ?? 'x'}`}
              onClick={() => logRow(row)}
            >
              <div className="target-result-head">
                <span className="name">
                  {foodName(row.food, lang)}
                  {row.state ? ` (${t(row.state === 'raw' ? 'state.raw' : 'state.cooked').toLowerCase()})` : ''}
                </span>
                <span className="target-grams">{row.grams} g</span>
              </div>
              <div className="stat-row four">
                <div className="stat">
                  <div className="label">{t('macro.kcal')}</div>
                  <div className="value accent">{row.nutrients.kcal}</div>
                </div>
                <div className="stat">
                  <div className="label">{t('macro.protein')}</div>
                  <div className="value">{row.nutrients.protein} g</div>
                </div>
                <div className="stat">
                  <div className="label">{t('macro.carbs')}</div>
                  <div className="value">{row.nutrients.carbs} g</div>
                </div>
                <div className="stat">
                  <div className="label">{t('macro.fat')}</div>
                  <div className="value">{row.nutrients.fat} g</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </FormPage>
  )
}
