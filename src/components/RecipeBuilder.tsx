import { useMemo, useState } from 'react'
import { FormPage } from './FormPage'
import { IconTrash } from './icons'
import { useApp } from '../state/AppContext'
import { foodName, searchFoods, statesOf } from '../lib/foods'
import { MICRO_KEYS, microsFor, nutrientsFor, round1, sumMicros, sumNutrients } from '../lib/nutrition'
import type { Food, FoodState, Micros, Nutrients } from '../lib/types'

interface RecipeLine {
  food: Food
  state: FoodState | undefined
  grams: string
}

interface RecipeBuilderProps {
  onBack: () => void
  /**
   * Valeurs pour 100 g du mélange, prêtes à remplir la fiche d'aliment, et
   * `composition` — le détail des ingrédients en texte — pour ne pas perdre
   * cette information une fois la recette réduite à ses valeurs pour 100 g.
   */
  onApply: (result: { per100: Nutrients; micros: Micros | null; composition: string }) => void
}

/**
 * Combine plusieurs aliments déjà connus, chacun à sa propre quantité, et
 * recalcule la somme proportionnelle — macros et micros — ramenée à 100 g du
 * mélange. Sert à composer un plat maison sans ressaisir ses valeurs à la main.
 */
export function RecipeBuilder({ onBack, onApply }: RecipeBuilderProps) {
  const { t, lang, foods } = useApp()
  const [query, setQuery] = useState('')
  const [lines, setLines] = useState<RecipeLine[]>([])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchFoods(foods, query, lang).slice(0, 20)
  }, [foods, query, lang])

  const addLine = (food: Food) => {
    const hasStates = statesOf(food).length > 0
    setLines((current) => [...current, { food, state: hasStates ? food.state : undefined, grams: String(food.serving) }])
    setQuery('')
  }

  const removeLine = (index: number) => {
    setLines((current) => current.filter((_, i) => i !== index))
  }

  const setGrams = (index: number, grams: string) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, grams } : line)))
  }

  const num = (value: string) => {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  const stateLabel = (state: FoodState | undefined) =>
    state ? ` (${t(state === 'raw' ? 'state.raw' : 'state.cooked').toLowerCase()})` : ''

  // Le détail des ingrédients, gardé en texte : sans lui, la composition
  // exacte de la recette disparaît une fois réduite à ses valeurs pour 100 g.
  const composition = lines
    .map((line) => `${num(line.grams)} g ${t('recipe.of')} ${foodName(line.food, lang)}${stateLabel(line.state)}`)
    .join(' + ')

  const totalGrams = round1(lines.reduce((sum, line) => sum + num(line.grams), 0))
  const totalNutrients = sumNutrients(lines.map((line) => nutrientsFor(line.food, num(line.grams), line.state)))
  const totalMicros = sumMicros(lines.map((line) => microsFor(line.food, num(line.grams))))
  const hasMicros = lines.some((line) => line.food.micros)

  const ratio = totalGrams > 0 ? 100 / totalGrams : 0
  const per100: Nutrients = {
    kcal: Math.round(totalNutrients.kcal * ratio),
    protein: round1(totalNutrients.protein * ratio),
    carbs: round1(totalNutrients.carbs * ratio),
    fat: round1(totalNutrients.fat * ratio),
    fiber: round1(totalNutrients.fiber * ratio),
  }
  const micros: Micros | null = hasMicros
    ? MICRO_KEYS.reduce((acc, key) => {
        acc[key] = totalMicros[key] * ratio
        return acc
      }, {} as Micros)
    : null

  const canApply = totalGrams > 0 && lines.length > 0

  return (
    <FormPage title={t('recipe.title')} subtitle={t('recipe.subtitle')} onBack={onBack}>
      <div className="field">
        <label htmlFor="recipe-search">{t('add.search')}</label>
        <input
          id="recipe-search"
          name="recipe-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('add.search')}
        />
      </div>

      {results.length > 0 ? (
        <div className="food-list">
          {results.map((food) => (
            <div className="food-row" key={food.id}>
              <button
                type="button"
                className="info"
                style={{ textAlign: 'left', background: 'none' }}
                onClick={() => addLine(food)}
              >
                <div className="name">{foodName(food, lang)}</div>
                <div className="macros">
                  {t('macro.protein.short')} {food.per100.protein} · {t('macro.carbs.short')} {food.per100.carbs} ·{' '}
                  {t('macro.fat.short')} {food.per100.fat} — {t('add.per100')}
                  {stateLabel(food.state)}
                </div>
              </button>
              <span className="kcal">{food.per100.kcal}</span>
            </div>
          ))}
        </div>
      ) : null}

      {lines.length === 0 ? (
        <p className="hint">{t('recipe.empty')}</p>
      ) : (
        <div className="stack">
          <div className="list-head">
            <span>{t('recipe.ingredients')}</span>
            <span>{t('recipe.totalWeight', { n: totalGrams })}</span>
          </div>

          <div className="food-list">
            {lines.map((line, index) => (
              <div className="recipe-line" key={`${line.food.id}-${index}`}>
                <span className="name">
                  {foodName(line.food, lang)}
                  {stateLabel(line.state)}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={line.grams}
                  onChange={(event) => setGrams(index, event.target.value)}
                  aria-label={t('add.quantity')}
                />
                <span className="unit">g</span>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removeLine(index)}
                  aria-label={t('common.delete')}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="stat-row five">
            <div className="stat">
              <div className="label">{t('macro.kcal')}</div>
              <div className="value accent">{per100.kcal}</div>
            </div>
            <div className="stat">
              <div className="label">{t('macro.protein')}</div>
              <div className="value">{per100.protein} g</div>
            </div>
            <div className="stat">
              <div className="label">{t('macro.carbs')}</div>
              <div className="value">{per100.carbs} g</div>
            </div>
            <div className="stat">
              <div className="label">{t('macro.fat')}</div>
              <div className="value">{per100.fat} g</div>
            </div>
            <div className="stat">
              <div className="label">{t('macro.fiber')}</div>
              <div className="value">{per100.fiber} g</div>
            </div>
          </div>
          <p className="hint">{t('recipe.per100Hint')}</p>
        </div>
      )}

      <button
        type="button"
        className="btn"
        disabled={!canApply}
        onClick={() => onApply({ per100, micros, composition })}
      >
        {t('recipe.apply')}
      </button>
    </FormPage>
  )
}
