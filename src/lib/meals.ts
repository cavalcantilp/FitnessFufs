import type { MealId } from './types'

export const MEALS: MealId[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** Repas proposé par défaut selon l'heure locale, pour éviter une sélection manuelle. */
export function defaultMeal(now: Date = new Date()): MealId {
  const hour = now.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}
