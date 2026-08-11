import type {
  ActivityLevel,
  Food,
  FoodPortion,
  FoodState,
  MicroKey,
  Micros,
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

/**
 * Bornes des curseurs, en grammes par kilo de poids de corps. Assez larges pour
 * qu'aucun préréglage ne bute contre une extrémité : le plancher des lipides
 * (0,5) correspond au minimum couramment retenu pour la fonction hormonale, le
 * plafond (2,5) couvre le cétogène, et les protéines montent jusqu'à 3,0 pour
 * les approches très riches en protéines.
 */
export const MACRO_RANGES = {
  protein: { min: 0.8, max: 3, step: 0.1 },
  fat: { min: 0.5, max: 2.5, step: 0.1 },
} as const

export type MacroPresetId = 'balanced' | 'highprotein' | 'lowcarb' | 'keto' | 'endurance'

/** Un préréglage ne fixe que protéines et lipides : les glucides suivent. */
export interface MacroPreset {
  proteinPerKg: number
  fatPerKg: number
}

export const MACRO_PRESETS: Record<MacroPresetId, MacroPreset> = {
  balanced: { proteinPerKg: 2, fatPerKg: 0.9 },
  highprotein: { proteinPerKg: 2.5, fatPerKg: 0.8 },
  lowcarb: { proteinPerKg: 2, fatPerKg: 1.5 },
  // 1,9 g/kg laisse une trentaine de grammes de glucides sur un objectif en
  // déficit, là où 2,2 saturait déjà l'apport et affichait l'alerte d'emblée.
  keto: { proteinPerKg: 1.8, fatPerKg: 1.9 },
  endurance: { proteinPerKg: 1.6, fatPerKg: 0.7 },
}

export const MACRO_PRESET_ORDER: MacroPresetId[] = [
  'balanced',
  'highprotein',
  'lowcarb',
  'keto',
  'endurance',
]

/**
 * Préréglage correspondant aux curseurs, déduit des valeurs plutôt que stocké :
 * bouger une glissière bascule donc sur « personnalisé », et revenir pile sur
 * les valeurs d'un programme le re-sélectionne.
 */
export function presetOf(macros: MacroPreset): MacroPresetId | 'custom' {
  const near = (a: number, b: number) => Math.abs(a - b) < 0.001
  const match = MACRO_PRESET_ORDER.find(
    (id) =>
      near(MACRO_PRESETS[id].proteinPerKg, macros.proteinPerKg) &&
      near(MACRO_PRESETS[id].fatPerKg, macros.fatPerKg),
  )
  return match ?? 'custom'
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

export interface Targets extends Nutrients {
  bmr: number
  tdee: number
  /** Écart calorique quotidien appliqué : négatif en déficit, positif en surplus. */
  adjustment: number
  /**
   * Objectif avant le plancher du métabolisme de base. Sous ce plancher, c'est
   * la seule valeur qui suit encore le poids, l'âge, l'activité et l'objectif —
   * l'afficher évite de croire l'application figée.
   */
  requestedKcal: number
  /** Vrai si l'objectif descend sous le métabolisme de base. */
  belowBmr: boolean
  /** Calories apportées par chaque macronutriment, pour la répartition visuelle. */
  proteinKcal: number
  carbsKcal: number
  fatKcal: number
  /** Vrai si protéines et lipides dépassent déjà l'objectif : plus de place pour les glucides. */
  macrosOverflow: boolean
  /** De combien protéines et lipides débordent l'objectif, en kcal. */
  macrosExcess: number
}

/**
 * Objectifs quotidiens déduits du profil. L'apport est plafonné au métabolisme
 * de base afin de ne jamais proposer un objectif dangereusement bas.
 *
 * Protéines et lipides viennent du poids de corps ; les glucides absorbent le
 * solde calorique, quitte à tomber à zéro si l'objectif est trop serré.
 */
export function computeTargets(profile: Profile): Targets {
  const base = bmr(profile.weight, profile.height, profile.age, profile.sex)
  const maintenance = base * ACTIVITY_FACTORS[profile.activity]
  const adjustment = (-profile.goalRate * KCAL_PER_KG) / 7
  const rawTarget = maintenance + adjustment
  const kcal = Math.max(rawTarget, base)

  const protein = profile.weight * profile.proteinPerKg
  const fat = profile.weight * profile.fatPerKg
  const proteinKcal = protein * KCAL_PER_GRAM.protein
  const fatKcal = fat * KCAL_PER_GRAM.fat
  const remaining = kcal - proteinKcal - fatKcal
  const carbsKcal = Math.max(0, remaining)

  return {
    bmr: Math.round(base),
    tdee: Math.round(maintenance),
    adjustment: Math.round(adjustment),
    requestedKcal: Math.round(rawTarget),
    belowBmr: rawTarget < base,
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbsKcal / KCAL_PER_GRAM.carbs),
    fiber: fiberTarget(kcal),
    proteinKcal: Math.round(proteinKcal),
    fatKcal: Math.round(fatKcal),
    carbsKcal: Math.round(carbsKcal),
    macrosOverflow: remaining < 0,
    macrosExcess: Math.round(Math.max(0, -remaining)),
  }
}

/**
 * Valeurs et portion usuelle correspondant à un état de préparation. Un aliment
 * sans variante ignore l'état demandé et renvoie toujours ses propres valeurs.
 */
export function portionOf(food: Food, state?: FoodState): FoodPortion {
  if (food.alt && state && food.state && state !== food.state) return food.alt
  return { per100: food.per100, serving: food.serving }
}

/** Valeurs nutritionnelles d'une quantité donnée d'un aliment, dans l'état pesé. */
export function nutrientsFor(food: Food, grams: number, state?: FoodState): Nutrients {
  const { per100 } = portionOf(food, state)
  const ratio = grams / 100
  return {
    kcal: Math.round(per100.kcal * ratio),
    protein: round1(per100.protein * ratio),
    carbs: round1(per100.carbs * ratio),
    fat: round1(per100.fat * ratio),
    fiber: round1(per100.fiber * ratio),
  }
}

export const EMPTY_NUTRIENTS: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

export function sumNutrients(items: Nutrients[]): Nutrients {
  const total = items.reduce(
    (acc, n) => ({
      kcal: acc.kcal + n.kcal,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
      // Les entrées d'avant l'ajout des fibres n'ont pas le champ.
      fiber: acc.fiber + (n.fiber ?? 0),
    }),
    EMPTY_NUTRIENTS,
  )
  return {
    kcal: Math.round(total.kcal),
    protein: round1(total.protein),
    carbs: round1(total.carbs),
    fat: round1(total.fat),
    fiber: round1(total.fiber),
  }
}

/** Micronutriments d'une quantité donnée. Absents si l'aliment n'est pas renseigné. */
export function microsFor(food: Food, grams: number): Micros | null {
  if (!food.micros) return null
  const ratio = grams / 100
  const scaled = {} as Micros
  for (const key of MICRO_KEYS) {
    scaled[key] = food.micros[key] * ratio
  }
  return scaled
}

export const MICRO_KEYS: MicroKey[] = [
  'sodium',
  'potassium',
  'calcium',
  'iron',
  'magnesium',
  'zinc',
  'vitaminC',
  'vitaminD',
  'vitaminB12',
]

/** Unité d'affichage de chaque micronutriment. */
export const MICRO_UNITS: Record<MicroKey, 'mg' | 'µg'> = {
  sodium: 'mg',
  potassium: 'mg',
  calcium: 'mg',
  iron: 'mg',
  magnesium: 'mg',
  zinc: 'mg',
  vitaminC: 'mg',
  vitaminD: 'µg',
  vitaminB12: 'µg',
}

/**
 * Apports quotidiens de référence adulte (règlement UE 1169/2011, valeurs
 * nutritionnelles de référence). Le sodium n'a pas d'ANC mais une limite haute :
 * 2000 mg, au-delà desquels l'apport est excessif.
 */
export const MICRO_REFERENCE: Record<MicroKey, number> = {
  sodium: 2000,
  potassium: 3500,
  calcium: 800,
  iron: 14,
  magnesium: 375,
  zinc: 10,
  vitaminC: 80,
  vitaminD: 5,
  vitaminB12: 2.5,
}

/** Le sodium se lit comme un plafond, pas comme un objectif à atteindre. */
export const MICRO_IS_LIMIT: Partial<Record<MicroKey, boolean>> = { sodium: true }

export function sumMicros(items: (Micros | null)[]): Micros {
  const total = {} as Micros
  for (const key of MICRO_KEYS) {
    total[key] = 0
  }
  for (const item of items) {
    if (!item) continue
    for (const key of MICRO_KEYS) {
      total[key] += item[key]
    }
  }
  return total
}

/**
 * Objectif de fibres : 14 g pour 1000 kcal, la recommandation la plus répandue,
 * plancher à 25 g pour ne pas descendre sous le repère usuel adulte.
 */
export function fiberTarget(kcal: number): number {
  return Math.max(25, Math.round((kcal / 1000) * 14))
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

/**
 * Vrai si la valeur reste à 10 % près de l'objectif, au-dessus comme
 * en dessous — le repère que le calendrier utilise pour juger une journée
 * « respectée » plutôt que d'exiger une correspondance exacte, illusoire au
 * gramme près.
 */
export function withinTolerance(value: number, goal: number, tolerance = 0.1): boolean {
  return goal > 0 && Math.abs(value - goal) / goal <= tolerance
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
