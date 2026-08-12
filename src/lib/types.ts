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
  /**
   * Déplie d'office le panneau des macros du jour dans le journal, pour qui
   * ajuste sa répartition au quotidien plutôt qu'une fois pour toutes.
   */
  dayMacrosOpen: boolean
}

/**
 * Répartition propre à une journée : jour d'entraînement, jour de repos, écart
 * assumé. Absente, la journée suit le profil — rien n'est recopié à l'avance,
 * pour qu'une modification du profil se propage aux jours non personnalisés.
 */
export interface DayMacros {
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

/** Mesures ménagères : personne ne pèse un œuf ou une cuillère de yaourt. */
export type PortionKey =
  | 'unit'
  | 'spoon'
  | 'teaspoon'
  | 'slice'
  | 'glass'
  | 'pot'
  | 'handful'
  | 'dose'

export interface PortionUnit {
  key: PortionKey
  /** Poids d'une mesure, en grammes. */
  grams: number
}

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
  /** Provenance : table intégrée, saisie manuelle, ou Open Food Facts. */
  source?: 'builtin' | 'manual' | 'off'
  /** Marque, renseignée pour les produits emballés. */
  brand?: string
  /** Code-barres, quand l'aliment vient d'un scan ou d'Open Food Facts. */
  barcode?: string
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
  /** Mesures ménagères proposées à la saisie, en plus des grammes. */
  portions?: PortionUnit[]
  /**
   * Termes alternatifs pris en compte par la recherche : variantes régionales
   * (« biscoito » au Brésil, « bolacha » au Portugal), marques usuelles,
   * préparations. Invisibles dans l'interface.
   */
  aliases?: string[]
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

export interface BodyFatEntry {
  /** Date au format YYYY-MM-DD, unique : une estimation par jour. */
  date: string
  percent: number
}

/** Tour de taille, de hanches, de poitrine — en centimètres. */
export type MeasurementKey = 'waist' | 'hips' | 'chest'

export interface MeasurementEntry {
  /** Date au format YYYY-MM-DD, unique : une entrée par jour. */
  date: string
  /**
   * Facultatives chacune : on ne prend pas forcément toutes les mesures le
   * même jour, une entrée peut n'en renseigner qu'une seule.
   */
  values: Partial<Record<MeasurementKey, number>>
}

export type Lang = 'fr' | 'pt' | 'es' | 'en' | 'it'
