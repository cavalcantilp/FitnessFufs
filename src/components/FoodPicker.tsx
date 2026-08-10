import { useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import { FOOD_CATEGORIES, foodName, searchFoods } from '../lib/foods'
import { IconStar } from './icons'
import type { Food, FoodCategory } from '../lib/types'
import type { TranslationKey } from '../i18n/translations'

type Filter = 'all' | 'favorites' | 'mine' | FoodCategory

interface FoodPickerProps {
  onSelect: (food: Food) => void
  onCreate: (query: string) => void
}

/** Recherche, filtres et liste d'aliments — partagés par l'onglet « Ajouter » et le journal. */
export function FoodPicker({ onSelect, onCreate }: FoodPickerProps) {
  const { t, lang, foods, favorites, toggleFavorite } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('cat.all') },
    { id: 'favorites', label: t('cat.favorites') },
    { id: 'mine', label: t('cat.mine') },
    ...FOOD_CATEGORIES.map((category) => ({
      id: category as Filter,
      label: t(`cat.${category}` as TranslationKey),
    })),
  ]

  const results = useMemo(() => {
    let pool = foods
    if (filter === 'favorites') pool = pool.filter((food) => favorites.includes(food.id))
    else if (filter === 'mine') pool = pool.filter((food) => food.custom)
    else if (filter !== 'all') pool = pool.filter((food) => food.category === filter)
    return searchFoods(pool, query, lang).slice(0, 60)
  }, [foods, filter, favorites, query, lang])

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('add.search')}
        aria-label={t('add.search')}
      />

      <div className="chips">
        {filters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`chip${filter === entry.id ? ' active' : ''}`}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="card stack">
          <p className="hint">{t('add.noResults')}</p>
          <button type="button" className="btn secondary" onClick={() => onCreate(query)}>
            {query.trim() ? t('add.createFrom', { q: query.trim() }) : t('add.custom')}
          </button>
        </div>
      ) : (
        <>
          <div className="food-list">
            {results.map((food) => {
              const isFavorite = favorites.includes(food.id)
              return (
                <div className="food-row" key={food.id}>
                  <button
                    type="button"
                    className="info"
                    style={{ textAlign: 'left', background: 'none' }}
                    onClick={() => onSelect(food)}
                  >
                    <div className="name">{foodName(food, lang)}</div>
                    <div className="macros">
                      {t('macro.protein.short')} {food.per100.protein} · {t('macro.carbs.short')}{' '}
                      {food.per100.carbs} · {t('macro.fat.short')} {food.per100.fat} —{' '}
                      {t('add.per100')}
                      {/* Les chiffres affichés sont ceux de l'état par défaut : on le nomme. */}
                      {food.state
                        ? ` ${t(food.state === 'raw' ? 'state.raw' : 'state.cooked').toLowerCase()}`
                        : ''}
                    </div>
                  </button>
                  <span className="kcal">{food.per100.kcal}</span>
                  <button
                    type="button"
                    className={`icon-btn star${isFavorite ? ' on' : ''}`}
                    onClick={() => toggleFavorite(food.id)}
                    aria-label={t('cat.favorites')}
                    aria-pressed={isFavorite}
                  >
                    <IconStar filled={isFavorite} />
                  </button>
                </div>
              )
            })}
          </div>
          <button type="button" className="btn secondary" onClick={() => onCreate(query)}>
            {t('add.custom')}
          </button>
        </>
      )}
    </>
  )
}
