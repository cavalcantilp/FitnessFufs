export type Sex = 'male' | 'female'

/** Facteurs multiplicateurs appliqués au métabolisme de base. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'

/** Variation de poids visée, en kg par semaine (négatif = prise de masse). */
export type GoalRate = 1.5 | 1 | 0.75 | 0.5 | 0.25 | 0 | -0.25 | -0.5

export type MacroSplitId = 'balanced' | 'lowcarb' | 'highprotein' | 'keto' | 'custom'

export interface MacroSplit {
  /** Part des calories totales, en pourcentage. Le total doit faire 100. */
  protein: number
  carbs: number
  fat: number
}

export interface Profile {
  height: number
  weight: number
  age: number
  sex: Sex
  activity: ActivityLevel
  goalRate: GoalRate
  splitId: MacroSplitId
  customSplit: MacroSplit
}

export interface Nutrients {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Food {
  id: string
  /** Libellé par défaut (français), utilisé tel quel pour les aliments personnalisés. */
  name: string
  /** Traductions du libellé, présentes uniquement sur les aliments intégrés. */
  i18n?: Partial<Record<Lang, string>>
  /** Valeurs pour 100 g / 100 ml. */
  per100: Nutrients
  /** Portion usuelle en grammes, proposée par défaut à l'ajout. */
  serving: number
  category: FoodCategory
  custom?: boolean
}

export type FoodCategory =
  | 'protein'
  | 'carbs'
  | 'dairy'
  | 'fruit'
  | 'veg'
  | 'fat'
  | 'drink'
  | 'snack'
  | 'dish'

export interface DiaryEntry {
  id: string
  /** Date au format YYYY-MM-DD. */
  date: string
  meal: MealId
  foodId: string
  /** Libellé figé au moment de l'ajout : l'entrée survit à la suppression de l'aliment. */
  label: string
  grams: number
  nutrients: Nutrients
}

export interface WeightEntry {
  /** Date au format YYYY-MM-DD, unique : une pesée par jour. */
  date: string
  weight: number
}

export type Lang = 'fr' | 'pt' | 'es' | 'en' | 'it'
