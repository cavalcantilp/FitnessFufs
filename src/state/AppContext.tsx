import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BUILTIN_FOODS } from '../lib/foods'
import { computeTargets, nutrientsFor, type Targets } from '../lib/nutrition'
import { load, save, clearAll, STORAGE_KEYS } from '../lib/storage'
import { detectLang, TRANSLATIONS, type TranslationKey } from '../i18n/translations'
import type {
  DiaryEntry,
  Food,
  FoodState,
  Lang,
  MealId,
  Profile,
  WeightEntry,
} from '../lib/types'

export const DEFAULT_PROFILE: Profile = {
  height: 175,
  weight: 75,
  age: 30,
  sex: 'male',
  activity: 'light',
  goalRate: 0.5,
  proteinPerKg: 2,
  fatPerKg: 0.9,
}

export interface ExportPayload {
  version: 1
  exportedAt: string
  profile: Profile
  entries: DiaryEntry[]
  weights: WeightEntry[]
  customFoods: Food[]
  favorites: string[]
}

interface AppState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string

  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  targets: Targets

  onboarded: boolean
  completeOnboarding: () => void

  entries: DiaryEntry[]
  entriesFor: (date: string) => DiaryEntry[]
  addEntry: (date: string, meal: MealId, food: Food, grams: number, state?: FoodState) => void
  removeEntry: (id: string) => void
  copyDay: (from: string, to: string) => number

  weights: WeightEntry[]
  logWeight: (date: string, weight: number) => void
  removeWeight: (date: string) => void

  foods: Food[]
  customFoods: Food[]
  addCustomFood: (food: Omit<Food, 'id' | 'custom'>) => Food
  /** Range un aliment déjà constitué, sans le dupliquer s'il est connu. */
  saveFood: (food: Food) => Food
  /** Corrige un aliment personnel — valeurs d'étiquette, nom, portion. */
  updateCustomFood: (id: string, patch: Partial<Food>) => void
  removeCustomFood: (id: string) => void

  favorites: string[]
  toggleFavorite: (id: string) => void

  exportData: () => ExportPayload
  importData: (payload: unknown) => boolean
  resetAll: () => void
}

const AppContext = createContext<AppState | null>(null)

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => load(STORAGE_KEYS.lang, detectLang()))
  const [profile, setProfile] = useState<Profile>(() => ({
    ...DEFAULT_PROFILE,
    ...load(STORAGE_KEYS.profile, {} as Partial<Profile>),
  }))
  const [onboarded, setOnboarded] = useState<boolean>(() => load(STORAGE_KEYS.onboarded, false))
  const [entries, setEntries] = useState<DiaryEntry[]>(() => load(STORAGE_KEYS.entries, []))
  const [weights, setWeights] = useState<WeightEntry[]>(() => load(STORAGE_KEYS.weights, []))
  const [customFoods, setCustomFoods] = useState<Food[]>(() => load(STORAGE_KEYS.customFoods, []))
  const [favorites, setFavorites] = useState<string[]>(() => load(STORAGE_KEYS.favorites, []))

  useEffect(() => save(STORAGE_KEYS.lang, lang), [lang])
  useEffect(() => save(STORAGE_KEYS.profile, profile), [profile])
  useEffect(() => save(STORAGE_KEYS.onboarded, onboarded), [onboarded])
  useEffect(() => save(STORAGE_KEYS.entries, entries), [entries])
  useEffect(() => save(STORAGE_KEYS.weights, weights), [weights])
  useEffect(() => save(STORAGE_KEYS.customFoods, customFoods), [customFoods])
  useEffect(() => save(STORAGE_KEYS.favorites, favorites), [favorites])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = TRANSLATIONS[lang][key] ?? TRANSLATIONS.fr[key] ?? key
      if (!vars) return template
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template,
      )
    },
    [lang],
  )

  const foods = useMemo(() => [...customFoods, ...BUILTIN_FOODS], [customFoods])
  const targets = useMemo(() => computeTargets(profile), [profile])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((current) => ({ ...current, ...patch }))
  }, [])

  const entriesFor = useCallback(
    (date: string) => entries.filter((entry) => entry.date === date),
    [entries],
  )

  const addEntry = useCallback(
    (date: string, meal: MealId, food: Food, grams: number, state?: FoodState) => {
      setEntries((current) => [
        ...current,
        {
          id: newId(),
          date,
          meal,
          foodId: food.id,
          label: food.name,
          grams,
          state,
          nutrients: nutrientsFor(food, grams, state),
        },
      ])
    },
    [],
  )

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }, [])

  /** Recopie un jour vers un autre et renvoie le nombre de lignes ajoutées. */
  const copyDay = useCallback((from: string, to: string) => {
    let copied = 0
    setEntries((current) => {
      const source = current.filter((entry) => entry.date === from)
      copied = source.length
      if (!source.length) return current
      return [...current, ...source.map((entry) => ({ ...entry, id: newId(), date: to }))]
    })
    return copied
  }, [])

  const logWeight = useCallback((date: string, weight: number) => {
    setWeights((current) => {
      const next = current.filter((entry) => entry.date !== date)
      next.push({ date, weight })
      next.sort((a, b) => a.date.localeCompare(b.date))
      return next
    })
    // Le profil suit la dernière pesée pour que les objectifs restent cohérents.
    setProfile((current) => ({ ...current, weight }))
  }, [])

  const removeWeight = useCallback((date: string) => {
    setWeights((current) => current.filter((entry) => entry.date !== date))
  }, [])

  const addCustomFood = useCallback((food: Omit<Food, 'id' | 'custom'>) => {
    const created: Food = { ...food, id: `custom-${newId()}`, custom: true }
    setCustomFoods((current) => [created, ...current])
    return created
  }, [])

  const saveFood = useCallback((food: Food) => {
    setCustomFoods((current) =>
      current.some((item) => item.id === food.id) ? current : [food, ...current],
    )
    return food
  }, [])

  const updateCustomFood = useCallback((id: string, patch: Partial<Food>) => {
    setCustomFoods((current) =>
      current.map((food) => (food.id === id ? { ...food, ...patch } : food)),
    )
  }, [])

  const removeCustomFood = useCallback((id: string) => {
    setCustomFoods((current) => current.filter((food) => food.id !== id))
    setFavorites((current) => current.filter((favorite) => favorite !== id))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
  }, [])

  const exportData = useCallback(
    (): ExportPayload => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      entries,
      weights,
      customFoods,
      favorites,
    }),
    [profile, entries, weights, customFoods, favorites],
  )

  const importData = useCallback((payload: unknown) => {
    if (typeof payload !== 'object' || payload === null) return false
    const data = payload as Partial<ExportPayload>
    if (!data.profile || !Array.isArray(data.entries)) return false

    setProfile({ ...DEFAULT_PROFILE, ...data.profile })
    setEntries(data.entries)
    setWeights(Array.isArray(data.weights) ? data.weights : [])
    setCustomFoods(Array.isArray(data.customFoods) ? data.customFoods : [])
    setFavorites(Array.isArray(data.favorites) ? data.favorites : [])
    setOnboarded(true)
    return true
  }, [])

  const resetAll = useCallback(() => {
    clearAll()
    setProfile(DEFAULT_PROFILE)
    setEntries([])
    setWeights([])
    setCustomFoods([])
    setFavorites([])
    setOnboarded(false)
  }, [])

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang: setLangState,
      t,
      profile,
      updateProfile,
      targets,
      onboarded,
      completeOnboarding: () => setOnboarded(true),
      entries,
      entriesFor,
      addEntry,
      removeEntry,
      copyDay,
      weights,
      logWeight,
      removeWeight,
      foods,
      customFoods,
      addCustomFood,
      saveFood,
      updateCustomFood,
      removeCustomFood,
      favorites,
      toggleFavorite,
      exportData,
      importData,
      resetAll,
    }),
    [
      lang,
      t,
      profile,
      updateProfile,
      targets,
      onboarded,
      entries,
      entriesFor,
      addEntry,
      removeEntry,
      copyDay,
      weights,
      logWeight,
      removeWeight,
      foods,
      customFoods,
      addCustomFood,
      saveFood,
      updateCustomFood,
      removeCustomFood,
      favorites,
      toggleFavorite,
      exportData,
      importData,
      resetAll,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp doit être utilisé dans un AppProvider')
  return context
}
