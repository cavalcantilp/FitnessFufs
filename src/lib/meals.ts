import type { MealDef, MealId } from './types'
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

/** Le titre personnalisé prime ; à défaut, le libellé traduit du repas par défaut. */
export function mealLabel(meal: MealDef, t: (key: TranslationKey) => string): string {
  return meal.label ?? t(`meal.${meal.id}` as TranslationKey)
}
