import { normalize } from './foods'
import type { Lang, MealDef, MealId } from './types'
import type { TranslationKey } from '../i18n/translations'

/** Les quatre repas de départ, avant toute personnalisation par l'utilisateur. */
export const DEFAULT_MEALS: MealDef[] = [{ id: 'breakfast' }, { id: 'lunch' }, { id: 'dinner' }, { id: 'snack' }]

/** Nombre maximum de repas personnalisés en plus des quatre par défaut. */
export const MAX_CUSTOM_MEALS = 3

/** Repas proposé par défaut selon l'heure locale, pour éviter une sélection manuelle. */
export function defaultMeal(now: Date = new Date()): MealId {
  const hour = now.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}

/**
 * Mots-clés associés à chaque repas standard, par langue — l'assistant résume souvent un
 * repas suggéré par son type ("Petit-déj", "Collation"...) sans jamais citer d'identifiant
 * technique, donc deviner le repas visé passe par ces mots plutôt qu'une correspondance exacte.
 */
const MEAL_KEYWORDS: Record<Lang, Record<'breakfast' | 'lunch' | 'dinner' | 'snack', string[]>> = {
  fr: {
    breakfast: ['petit-dejeuner', 'petit dejeuner', 'petit-dej', 'petit dej'],
    lunch: ['dejeuner', 'midi'],
    dinner: ['diner', 'soir'],
    snack: ['collation', 'en-cas', 'encas', 'gouter', 'snack'],
  },
  pt: {
    breakfast: ['cafe da manha', 'cafe-da-manha'],
    lunch: ['almoco'],
    dinner: ['jantar'],
    snack: ['lanche'],
  },
  es: {
    breakfast: ['desayuno'],
    lunch: ['comida', 'almuerzo'],
    dinner: ['cena'],
    snack: ['tentempie', 'merienda', 'snack'],
  },
  en: {
    breakfast: ['breakfast'],
    lunch: ['lunch'],
    dinner: ['dinner'],
    snack: ['snack'],
  },
  it: {
    breakfast: ['colazione'],
    lunch: ['pranzo'],
    dinner: ['cena'],
    snack: ['spuntino', 'merenda'],
  },
}

/**
 * Devine le repas visé par le résumé d'une suggestion de l'assistant ("Petit-déj",
 * "Collation du soir"...) — à défaut de correspondance, laisse l'appelant retomber sur
 * defaultMeal() : deviner depuis un texte libre reste une estimation, jamais une certitude.
 */
export function guessMealFromLabel(label: string, mealDefs: MealDef[], lang: Lang): MealId | undefined {
  const normalizedLabel = normalize(label)

  // Un repas personnalisé n'a que son titre comme point de repère, aucun mot-clé à deviner.
  for (const meal of mealDefs) {
    if (!meal.label) continue
    if (normalizedLabel.includes(normalize(meal.label))) return meal.id
  }

  const keywords = MEAL_KEYWORDS[lang]
  for (const id of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    if (!mealDefs.some((meal) => meal.id === id)) continue
    if (keywords[id].some((keyword) => normalizedLabel.includes(keyword))) return id
  }

  return undefined
}

/** Le titre personnalisé prime ; à défaut, le libellé traduit du repas par défaut. */
export function mealLabel(meal: MealDef, t: (key: TranslationKey) => string): string {
  return meal.label ?? t(`meal.${meal.id}` as TranslationKey)
}
