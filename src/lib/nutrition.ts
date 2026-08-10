import type {
  ActivityLevel,
  Food,
  MacroSplit,
  MacroSplitId,
  Nutrients,
  Profile,
  Sex,
} from './types'

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
}

export const MACRO_SPLITS: Record<Exclude<MacroSplitId, 'custom'>, MacroSplit> = {
  balanced: { protein: 30, carbs: 40, fat: 30 },
  lowcarb: { protein: 35, carbs: 25, fat: 40 },
  highprotein: { protein: 40, carbs: 35, fat: 25 },
  keto: { protein: 25, carbs: 10, fat: 65 },
}

/** Calories par gramme de chaque macronutriment. */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

/** Une variation de 1 kg de masse grasse correspond à environ 7700 kcal. */
const KCAL_PER_KG = 7700

/** Métabolisme de base — équation de Mifflin-St Jeor. */
export function bmr(weight: number, height: number, age: number, sex: Sex): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

/** Dépense énergétique totale quotidienne. */
export function tdee(profile: Profile): number {
  return bmr(profile.weight, profile.height, profile.age, profile.sex) * ACTIVITY_FACTORS[profile.activity]
}

export function splitOf(profile: Profile): MacroSplit {
  return profile.splitId === 'custom' ? profile.customSplit : MACRO_SPLITS[profile.splitId]
}

export interface Targets extends Nutrients {
  bmr: number
  tdee: number
  /** Écart calorique quotidien appliqué : négatif en déficit, positif en surplus. */
  adjustment: number
  /** Vrai si l'objectif descend sous le métabolisme de base. */
  belowBmr: boolean
}

/**
 * Objectifs quotidiens déduits du profil. L'apport est plafonné au métabolisme
 * de base afin de ne jamais proposer un objectif dangereusement bas.
 */
export function computeTargets(profile: Profile): Targets {
  const base = bmr(profile.weight, profile.height, profile.age, profile.sex)
  const maintenance = base * ACTIVITY_FACTORS[profile.activity]
  const adjustment = (-profile.goalRate * KCAL_PER_KG) / 7
  const raw = maintenance + adjustment
  const kcal = Math.max(raw, base)
  const split = splitOf(profile)

  return {
    bmr: Math.round(base),
    tdee: Math.round(maintenance),
    adjustment: Math.round(adjustment),
    belowBmr: raw < base,
    kcal: Math.round(kcal),
    protein: Math.round((kcal * split.protein) / 100 / KCAL_PER_GRAM.protein),
    carbs: Math.round((kcal * split.carbs) / 100 / KCAL_PER_GRAM.carbs),
    fat: Math.round((kcal * split.fat) / 100 / KCAL_PER_GRAM.fat),
  }
}

/** Valeurs nutritionnelles d'une quantité donnée d'un aliment. */
export function nutrientsFor(food: Food, grams: number): Nutrients {
  const ratio = grams / 100
  return {
    kcal: Math.round(food.per100.kcal * ratio),
    protein: round1(food.per100.protein * ratio),
    carbs: round1(food.per100.carbs * ratio),
    fat: round1(food.per100.fat * ratio),
  }
}

export const EMPTY_NUTRIENTS: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export function sumNutrients(items: Nutrients[]): Nutrients {
  const total = items.reduce(
    (acc, n) => ({
      kcal: acc.kcal + n.kcal,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
    }),
    EMPTY_NUTRIENTS,
  )
  return {
    kcal: Math.round(total.kcal),
    protein: round1(total.protein),
    carbs: round1(total.carbs),
    fat: round1(total.fat),
  }
}

/** Calories reconstituées à partir des macros — sert à valider une saisie manuelle. */
export function kcalFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(
    protein * KCAL_PER_GRAM.protein + carbs * KCAL_PER_GRAM.carbs + fat * KCAL_PER_GRAM.fat,
  )
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function bmi(weight: number, height: number): number {
  if (height <= 0) return 0
  return round1(weight / (height / 100) ** 2)
}

export type BmiBand = 'under' | 'normal' | 'over' | 'obese'

export function bmiBand(value: number): BmiBand {
  if (value < 18.5) return 'under'
  if (value < 25) return 'normal'
  if (value < 30) return 'over'
  return 'obese'
}
