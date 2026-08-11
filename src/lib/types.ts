export type Sex = 'male' | 'female'

/** Facteurs multiplicateurs appliqués au métabolisme de base. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'

/** Variation de poids visée, en kg par semaine (négatif = prise de masse). */
export type GoalRate = 1.5 | 1 | 0.75 | 0.5 | 0.25 | 0 | -0.25 | -0.5

export interface Profile {
  height: number
  weight: number
  age: number
  sex: Sex
  activity: ActivityLevel
  goalRate: GoalRate
  /**
   * Protéines et lipides se fixent au poids de corps, pas en pourcentage des
   * calories : ce sont des besoins physiologiques qui ne bougent pas quand
   * l'objectif calorique change. Les glucides prennent ce qui reste.
   */
  proteinPerKg: number
  fatPerKg: number
}

export interface Nutrients {
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** Fibres alimentaires, comprises dans les glucides déclarés. */
  fiber: number
}

/**
 * Micronutriments suivis, pour 100 g. Sodium, potassium, calcium, fer,
 * magnésium et zinc en milligrammes ; vitamine C en milligrammes ; vitamines D
 * et B12 en microgrammes.
 */
export interface Micros {
  sodium: number
  potassium: number
  calcium: number
  iron: number
  magnesium: number
  zinc: number
  vitaminC: number
  vitaminD: number
  vitaminB12: number
}

export type MicroKey = keyof Micros

export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/**
 * État de préparation. Décisif sur le poids : 100 g de riz cru donnent environ
 * 280 g de riz cuit, donc les valeurs pour 100 g n'ont rien à voir.
 */
export type FoodState = 'raw' | 'cooked'

export interface FoodPortion {
  /** Valeurs pour 100 g / 100 ml dans cet état. */
  per100: Nutrients
  /** Portion usuelle en grammes dans cet état. */
  serving: number
}

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
  /** État décrit par per100. Renseigné uniquement si l'aliment a deux états. */
  state?: FoodState
  /** L'autre état de préparation : cru si per100 décrit le cuit, et inversement. */
  alt?: FoodPortion
  /**
   * Micronutriments pour 100 g dans l'état par défaut. Absent quand la
   * composition n'est pas établie de façon fiable — plats composés, produits
   * industriels, compléments : mieux vaut ne rien afficher qu'un chiffre inventé.
   */
  micros?: Micros
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
  | 'supplement'

export interface DiaryEntry {
  id: string
  /** Date au format YYYY-MM-DD. */
  date: string
  meal: MealId
  foodId: string
  /** Libellé figé au moment de l'ajout : l'entrée survit à la suppression de l'aliment. */
  label: string
  grams: number
  /** État pesé, quand l'aliment en propose deux. */
  state?: FoodState
  nutrients: Nutrients
}

export interface WeightEntry {
  /** Date au format YYYY-MM-DD, unique : une pesée par jour. */
  date: string
  weight: number
}

export type Lang = 'fr' | 'pt' | 'es' | 'en' | 'it'
