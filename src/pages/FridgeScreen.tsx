import { useMemo, useState } from 'react'
import { IconTrash } from '../components/icons'
import { useApp } from '../state/AppContext'
import { foodName, searchFoods, statesOf } from '../lib/foods'
import type { Food } from '../lib/types'

/**
 * Inventaire du frigo : les aliments sous la main, avec leur poids, pour
 * servir de base aux suggestions de repas tenant compte des macros restants.
 */
export function FridgeScreen() {
  const { t, lang, foods, fridge, addFridgeItem, updateFridgeItem, removeFridgeItem } = useApp()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchFoods(foods, query, lang).slice(0, 20)
  }, [foods, query, lang])

  const stateLabel = (state: Food['state']) =>
    state ? ` (${t(state === 'raw' ? 'state.raw' : 'state.cooked').toLowerCase()})` : ''

  const num = (value: string) => {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  const items = fridge
    .map((item) => ({ item, food: foods.find((entry) => entry.id === item.foodId) }))
    .filter((entry): entry is { item: (typeof fridge)[number]; food: Food } => Boolean(entry.food))

  const add = (food: Food) => {
    addFridgeItem(food, food.serving, statesOf(food).length > 0 ? food.state : undefined)
    setQuery('')
  }

  return (
    <div className="screen">
      <p className="hint">{t('fridge.hint')}</p>

      <div className="field">
        <label htmlFor="fridge-search">{t('add.search')}</label>
        <input
          id="fridge-search"
          name="fridge-search"
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
                onClick={() => add(food)}
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

      {items.length === 0 ? (
        <p className="hint">{t('fridge.empty')}</p>
      ) : (
        <div className="stack">
          <div className="list-head">
            <span>{t('fridge.items', { n: items.length })}</span>
          </div>

          <div className="food-list">
            {items.map(({ item, food }) => (
              <div className="recipe-line" key={item.id}>
                <span className="name">
                  {foodName(food, lang)}
                  {stateLabel(item.state)}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={String(item.grams)}
                  onChange={(event) => updateFridgeItem(item.id, num(event.target.value))}
                  aria-label={t('add.quantity')}
                />
                <span className="unit">g</span>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removeFridgeItem(item.id)}
                  aria-label={t('common.delete')}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
