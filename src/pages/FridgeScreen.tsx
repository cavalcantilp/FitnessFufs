import { useMemo, useState, type ReactNode } from 'react'
import { FormPage } from '../components/FormPage'
import { IconCupboard, IconFridge, IconPlus, IconSnowflake, IconTrash } from '../components/icons'
import { useApp } from '../state/AppContext'
import { foodName, searchFoods, statesOf } from '../lib/foods'
import type { Food, FridgeItem, FridgeLocation } from '../lib/types'

const SECTIONS: { location: FridgeLocation; icon: ReactNode; titleKey: 'fridge.section.fridge' | 'fridge.section.pantry' | 'fridge.section.freezer'; optionalGrams: boolean }[] = [
  { location: 'fridge', icon: <IconFridge size={20} />, titleKey: 'fridge.section.fridge', optionalGrams: false },
  { location: 'pantry', icon: <IconCupboard size={20} />, titleKey: 'fridge.section.pantry', optionalGrams: true },
  { location: 'freezer', icon: <IconSnowflake size={20} />, titleKey: 'fridge.section.freezer', optionalGrams: true },
]

/**
 * Inventaire de ce qu'il y a sous la main — frigo, placard, congélateur — avec
 * le poids disponible quand il est connu. Sert de base aux suggestions de
 * repas de l'assistant, qui lit les trois sections.
 */
export function FridgeScreen() {
  const { t, lang, foods, fridge, addFridgeItem, updateFridgeItem, removeFridgeItem } = useApp()
  const [searchingLocation, setSearchingLocation] = useState<FridgeLocation | null>(null)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchFoods(foods, query, lang).slice(0, 20)
  }, [foods, query, lang])

  const stateLabel = (state: Food['state']) =>
    state ? ` (${t(state === 'raw' ? 'state.raw' : 'state.cooked').toLowerCase()})` : ''

  const num = (value: string): number | undefined => {
    if (!value.trim()) return undefined
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  const entriesByLocation = useMemo(() => {
    const grouped: Record<FridgeLocation, { item: FridgeItem; food: Food }[]> = { fridge: [], pantry: [], freezer: [] }
    fridge.forEach((item) => {
      const food = foods.find((entry) => entry.id === item.foodId)
      if (!food) return
      grouped[item.location ?? 'fridge'].push({ item, food })
    })
    return grouped
  }, [fridge, foods])

  const closeSearch = () => {
    setSearchingLocation(null)
    setQuery('')
  }

  const add = (food: Food) => {
    if (!searchingLocation) return
    addFridgeItem(
      food,
      searchingLocation,
      searchingLocation === 'fridge' ? food.serving : undefined,
      statesOf(food).length > 0 ? food.state : undefined,
    )
    closeSearch()
  }

  if (searchingLocation) {
    const section = SECTIONS.find((entry) => entry.location === searchingLocation)
    return (
      <FormPage title={section ? t(section.titleKey) : ''} onBack={closeSearch}>
        <div className="field">
          <label htmlFor="fridge-search">{t('add.search')}</label>
          <input
            id="fridge-search"
            name="fridge-search"
            type="search"
            autoComplete="off"
            autoFocus
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
        ) : query.trim() ? (
          <p className="hint">{t('add.noResults')}</p>
        ) : null}
      </FormPage>
    )
  }

  return (
    <div className="screen">
      <p className="hint">{t('fridge.hint')}</p>

      {SECTIONS.map((section) => {
        const entries = entriesByLocation[section.location]
        return (
          <div className="stack" key={section.location}>
            <div className="fridge-section-head">
              {section.icon}
              <span className="fridge-section-title">{t(section.titleKey)}</span>
              <span className="fridge-section-count">{entries.length}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={t('fridge.addTo', { section: t(section.titleKey) })}
                onClick={() => setSearchingLocation(section.location)}
              >
                <IconPlus size={18} />
              </button>
            </div>

            {entries.length === 0 ? (
              <p className="hint">{t('fridge.empty')}</p>
            ) : (
              <div className="food-list">
                {entries.map(({ item, food }) => (
                  <div className="recipe-line" key={item.id}>
                    <span className="name">
                      {foodName(food, lang)}
                      {stateLabel(item.state)}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      className={section.optionalGrams ? 'optional-qty' : undefined}
                      value={item.grams === undefined ? '' : String(item.grams)}
                      placeholder={section.optionalGrams ? t('fridge.quantityOptional') : undefined}
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
            )}
          </div>
        )
      })}
    </div>
  )
}
