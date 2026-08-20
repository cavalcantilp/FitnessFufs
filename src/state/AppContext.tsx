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
  ChatMessage,
  DayMacros,
  DiaryEntry,
  Food,
  FoodState,
  FridgeItem,
  Lang,
  MealId,
  MeasurementEntry,
  MeasurementKey,
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
  dayMacrosOpen: false,
}

export interface ExportPayload {
  version: 1
  exportedAt: string
  profile: Profile
  entries: DiaryEntry[]
  weights: WeightEntry[]
  customFoods: Food[]
  favorites: string[]
  dayMacros?: Record<string, DayMacros>
  notes?: Record<string, string>
  measurements?: MeasurementEntry[]
  fridge?: FridgeItem[]
}

interface AppState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string

  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
  targets: Targets

  /** Journées dont la répartition s'écarte du profil, indexées par date. */
  dayMacros: Record<string, DayMacros>
  /** Objectifs d'une journée donnée, personnalisation comprise. */
  targetsFor: (date: string) => Targets
  setDayMacrosFor: (date: string, macros: DayMacros) => void
  clearDayMacros: (date: string) => void

  /** Notes libres par jour, indexées par date. */
  notes: Record<string, string>
  /** Enregistre la note d'un jour ; un texte vide ou blanc la supprime. */
  setNoteFor: (date: string, text: string) => void

  onboarded: boolean
  completeOnboarding: () => void

  /** Déclenchement automatique du tutoriel au premier passage sur un onglet. */
  tutorialsEnabled: boolean
  setTutorialsEnabled: (enabled: boolean) => void
  /** Onglets déjà vus par le tutoriel, indexés par identifiant d'onglet. */
  tutorialSeen: Record<string, boolean>
  markTutorialSeen: (tab: string) => void

  entries: DiaryEntry[]
  entriesFor: (date: string) => DiaryEntry[]
  addEntry: (date: string, meal: MealId, food: Food, grams: number, state?: FoodState) => void
  removeEntry: (id: string) => void
  copyDay: (from: string, to: string) => number

  weights: WeightEntry[]
  logWeight: (date: string, weight: number) => void
  removeWeight: (date: string) => void

  /** Mesures corporelles (tour de taille, hanches, poitrine), une entrée par jour. */
  measurements: MeasurementEntry[]
  /** Fusionne avec l'entrée du jour existante : mesurer la taille puis les hanches n'écrase pas l'une avec l'autre. */
  logMeasurements: (date: string, values: Partial<Record<MeasurementKey, number>>) => void
  /** Retire une seule mesure d'un jour ; l'entrée disparaît si elle devient vide. */
  removeMeasurement: (date: string, key: MeasurementKey) => void

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

  /** Aliments disponibles au frigo, avec leur poids — base des suggestions de repas. */
  fridge: FridgeItem[]
  addFridgeItem: (food: Food, grams: number, state?: FoodState) => void
  updateFridgeItem: (id: string, grams: number) => void
  removeFridgeItem: (id: string) => void

  /**
   * Clé personnelle Anthropic, envoyée directement depuis le navigateur.
   * Volontairement absente de l'export/import : un secret ne doit pas finir
   * dans une sauvegarde JSON partagée par erreur.
   */
  apiKey: string
  setApiKey: (key: string) => void

  /** Conversation avec l'assistant nutrition, locale à cet appareil. */
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void

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
  const [tutorialsEnabled, setTutorialsEnabled] = useState<boolean>(() =>
    load(STORAGE_KEYS.tutorialsEnabled, true),
  )
  const [tutorialSeen, setTutorialSeen] = useState<Record<string, boolean>>(() =>
    load(STORAGE_KEYS.tutorialSeen, {}),
  )
  const [entries, setEntries] = useState<DiaryEntry[]>(() => load(STORAGE_KEYS.entries, []))
  const [weights, setWeights] = useState<WeightEntry[]>(() => load(STORAGE_KEYS.weights, []))
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>(() =>
    load(STORAGE_KEYS.measurements, []),
  )
  const [customFoods, setCustomFoods] = useState<Food[]>(() => load(STORAGE_KEYS.customFoods, []))
  const [favorites, setFavorites] = useState<string[]>(() => load(STORAGE_KEYS.favorites, []))
  const [dayMacros, setDayMacros] = useState<Record<string, DayMacros>>(() =>
    load(STORAGE_KEYS.dayMacros, {}),
  )
  const [notes, setNotes] = useState<Record<string, string>>(() => load(STORAGE_KEYS.notes, {}))
  const [fridge, setFridge] = useState<FridgeItem[]>(() => load(STORAGE_KEYS.fridge, []))
  const [apiKey, setApiKey] = useState<string>(() => load(STORAGE_KEYS.apiKey, ''))
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => load(STORAGE_KEYS.chat, []))

  useEffect(() => save(STORAGE_KEYS.lang, lang), [lang])
  useEffect(() => save(STORAGE_KEYS.profile, profile), [profile])
  useEffect(() => save(STORAGE_KEYS.onboarded, onboarded), [onboarded])
  useEffect(() => save(STORAGE_KEYS.tutorialsEnabled, tutorialsEnabled), [tutorialsEnabled])
  useEffect(() => save(STORAGE_KEYS.tutorialSeen, tutorialSeen), [tutorialSeen])
  useEffect(() => save(STORAGE_KEYS.entries, entries), [entries])
  useEffect(() => save(STORAGE_KEYS.weights, weights), [weights])
  useEffect(() => save(STORAGE_KEYS.measurements, measurements), [measurements])
  useEffect(() => save(STORAGE_KEYS.customFoods, customFoods), [customFoods])
  useEffect(() => save(STORAGE_KEYS.favorites, favorites), [favorites])
  useEffect(() => save(STORAGE_KEYS.dayMacros, dayMacros), [dayMacros])
  useEffect(() => save(STORAGE_KEYS.notes, notes), [notes])
  useEffect(() => save(STORAGE_KEYS.fridge, fridge), [fridge])
  useEffect(() => save(STORAGE_KEYS.apiKey, apiKey), [apiKey])
  useEffect(() => save(STORAGE_KEYS.chat, chatMessages), [chatMessages])

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

  /**
   * Objectifs d'une journée : ceux du profil, sauf si la journée a sa propre
   * répartition. Le calcul est une poignée d'opérations, inutile de le mémoïser.
   */
  const targetsFor = useCallback(
    (date: string) => computeTargets({ ...profile, ...dayMacros[date] }),
    [profile, dayMacros],
  )

  const setDayMacrosFor = useCallback((date: string, macros: DayMacros) => {
    setDayMacros((current) => ({ ...current, [date]: macros }))
  }, [])

  /** Retire la personnalisation : la journée repasse sous le profil. */
  const clearDayMacros = useCallback((date: string) => {
    setDayMacros((current) => {
      if (!(date in current)) return current
      const next = { ...current }
      delete next[date]
      return next
    })
  }, [])

  const setNoteFor = useCallback((date: string, text: string) => {
    setNotes((current) => {
      const trimmed = text.trim()
      if (!trimmed) {
        if (!(date in current)) return current
        const next = { ...current }
        delete next[date]
        return next
      }
      return { ...current, [date]: trimmed }
    })
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((current) => ({ ...current, ...patch }))
  }, [])

  const markTutorialSeen = useCallback((tab: string) => {
    setTutorialSeen((current) => (current[tab] ? current : { ...current, [tab]: true }))
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

  const logMeasurements = useCallback(
    (date: string, values: Partial<Record<MeasurementKey, number>>) => {
      setMeasurements((current) => {
        const existing = current.find((entry) => entry.date === date)
        const merged = { ...existing?.values, ...values }
        const next = current.filter((entry) => entry.date !== date)
        next.push({ date, values: merged })
        next.sort((a, b) => a.date.localeCompare(b.date))
        return next
      })
    },
    [],
  )

  const removeMeasurement = useCallback((date: string, key: MeasurementKey) => {
    setMeasurements((current) =>
      current
        .map((entry) => {
          if (entry.date !== date) return entry
          const values = { ...entry.values }
          delete values[key]
          return { ...entry, values }
        })
        .filter((entry) => Object.keys(entry.values).length > 0),
    )
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

  const addFridgeItem = useCallback((food: Food, grams: number, state?: FoodState) => {
    setFridge((current) => [...current, { id: newId(), foodId: food.id, grams, state }])
  }, [])

  const updateFridgeItem = useCallback((id: string, grams: number) => {
    setFridge((current) => current.map((item) => (item.id === id ? { ...item, grams } : item)))
  }, [])

  const removeFridgeItem = useCallback((id: string) => {
    setFridge((current) => current.filter((item) => item.id !== id))
  }, [])

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((current) => [...current, message])
  }, [])

  const clearChat = useCallback(() => setChatMessages([]), [])

  const exportData = useCallback(
    (): ExportPayload => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      entries,
      weights,
      customFoods,
      favorites,
      dayMacros,
      notes,
      measurements,
      fridge,
    }),
    [profile, entries, weights, customFoods, favorites, dayMacros, notes, measurements, fridge],
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
    // Sauvegardes d'avant la fonctionnalité : aucune journée personnalisée, aucune note, aucune mesure.
    setDayMacros(data.dayMacros ?? {})
    setNotes(data.notes ?? {})
    setMeasurements(Array.isArray(data.measurements) ? data.measurements : [])
    setFridge(Array.isArray(data.fridge) ? data.fridge : [])
    setOnboarded(true)
    return true
  }, [])

  const resetAll = useCallback(() => {
    clearAll()
    setProfile(DEFAULT_PROFILE)
    setEntries([])
    setWeights([])
    setMeasurements([])
    setCustomFoods([])
    setFavorites([])
    setDayMacros({})
    setNotes({})
    setFridge([])
    setApiKey('')
    setChatMessages([])
    setOnboarded(false)
    setTutorialsEnabled(true)
    setTutorialSeen({})
  }, [])

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang: setLangState,
      t,
      profile,
      updateProfile,
      targets,
      dayMacros,
      targetsFor,
      setDayMacrosFor,
      clearDayMacros,
      notes,
      setNoteFor,
      onboarded,
      completeOnboarding: () => setOnboarded(true),
      tutorialsEnabled,
      setTutorialsEnabled,
      tutorialSeen,
      markTutorialSeen,
      entries,
      entriesFor,
      addEntry,
      removeEntry,
      copyDay,
      weights,
      logWeight,
      removeWeight,
      measurements,
      logMeasurements,
      removeMeasurement,
      foods,
      customFoods,
      addCustomFood,
      saveFood,
      updateCustomFood,
      removeCustomFood,
      favorites,
      toggleFavorite,
      fridge,
      addFridgeItem,
      updateFridgeItem,
      removeFridgeItem,
      apiKey,
      setApiKey,
      chatMessages,
      addChatMessage,
      clearChat,
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
      dayMacros,
      targetsFor,
      setDayMacrosFor,
      clearDayMacros,
      notes,
      setNoteFor,
      onboarded,
      tutorialsEnabled,
      setTutorialsEnabled,
      tutorialSeen,
      markTutorialSeen,
      entries,
      entriesFor,
      addEntry,
      removeEntry,
      copyDay,
      weights,
      logWeight,
      removeWeight,
      measurements,
      logMeasurements,
      removeMeasurement,
      foods,
      customFoods,
      addCustomFood,
      saveFood,
      updateCustomFood,
      removeCustomFood,
      favorites,
      toggleFavorite,
      fridge,
      addFridgeItem,
      updateFridgeItem,
      removeFridgeItem,
      apiKey,
      setApiKey,
      chatMessages,
      addChatMessage,
      clearChat,
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
