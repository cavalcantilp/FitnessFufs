import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../state/AppContext'
import { FOOD_CATEGORIES, foodName, searchFoods } from '../lib/foods'
import { searchOpenFoodFacts } from '../lib/openfoodfacts'
import { IconBarcode, IconStar } from './icons'
import type { Food, FoodCategory } from '../lib/types'
import type { TranslationKey } from '../i18n/translations'

type Filter = 'all' | 'favorites' | 'mine' | FoodCategory

interface FoodPickerProps {
  onSelect: (food: Food) => void
  onCreate: (query: string) => void
  onScan: () => void
}

/** Recherche, filtres et liste d'aliments — partagés par l'onglet « Ajouter » et le journal. */
export function FoodPicker({ onSelect, onCreate, onScan }: FoodPickerProps) {
  const { t, lang, foods, favorites, toggleFavorite } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [remote, setRemote] = useState<Food[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [remoteError, setRemoteError] = useState(false)

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
    // Pas de troncature : une liste coupée à 60 rendait la moitié de la base
    // introuvable pour qui parcourt au lieu de chercher.
    return searchFoods(pool, query, lang)
  }, [foods, filter, favorites, query, lang])

  // Les résultats distants ne valent que pour la recherche qui les a produits.
  useEffect(() => {
    setRemote(null)
    setRemoteError(false)
  }, [query])

  const searchRemote = async () => {
    setLoading(true)
    setRemoteError(false)
    try {
      setRemote(await searchOpenFoodFacts(query, lang))
    } catch {
      // Une panne de service ne doit pas se lire comme « ce produit n'existe pas ».
      setRemoteError(true)
      setRemote([])
    } finally {
      setLoading(false)
    }
  }

  const row = (food: Food) => {
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
            {food.per100.carbs} · {t('macro.fat.short')} {food.per100.fat} — {t('add.per100')}
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
  }

  const canSearchRemote = query.trim().length >= 3

  // Un produit déjà retenu figure dans la liste locale : l'afficher une seconde
  // fois côté Open Food Facts laisserait croire à un doublon.
  const newRemote = useMemo(
    () => (remote ?? []).filter((item) => !foods.some((known) => known.id === item.id)),
    [remote, foods],
  )

  return (
    <>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('add.search')}
          aria-label={t('add.search')}
        />
        <button type="button" className="icon-btn scan" onClick={onScan} aria-label={t('scan.title')}>
          <IconBarcode />
        </button>
      </div>

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
          {/* Créer un aliment doit rester atteignable sans dérouler la liste. */}
          <div className="list-head">
            <span>{t('add.results', { n: results.length })}</span>
            <button type="button" onClick={() => onCreate(query)}>
              + {t('add.custom')}
            </button>
          </div>

          <div className="food-list">{results.map(row)}</div>
        </>
      )}

      {/*
        Open Food Facts complète la table intégrée pour les produits emballés,
        à la demande : la table locale reste la réponse par défaut, et rien
        n'est interrogé tant que l'utilisateur n'a pas trouvé son compte.
      */}
      {canSearchRemote ? (
        remote === null ? (
          <button type="button" className="btn secondary" disabled={loading} onClick={searchRemote}>
            {loading ? t('off.searching') : t('off.search')}
          </button>
        ) : (
          <>
            <div className="list-head">
              <span>{t('off.results', { n: newRemote.length })}</span>
            </div>
            {newRemote.length === 0 ? (
              <p className={remoteError ? 'notice' : 'hint'}>
                {remoteError ? t('off.error') : t('off.none')}
              </p>
            ) : (
              <div className="food-list">{newRemote.map(row)}</div>
            )}
            <p className="hint">{t('off.source')}</p>
          </>
        )
      ) : null}
    </>
  )
}
