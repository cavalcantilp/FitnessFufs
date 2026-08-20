import { findFoodByExactName, findSimilarFoods, normalize, statesOf } from './foods'
import type { ChatMealItem, ChatMealSuggestion, Food, FoodState, Lang } from './types'

const BLOCK_RE = /<meals>([\s\S]*?)<\/meals>/i
/** Filet de sécurité si la réponse est tronquée (limite de tokens atteinte) avant la fermeture du bloc. */
const UNCLOSED_BLOCK_RE = /<meals>[\s\S]*$/i

interface RawMealItem {
  foodId?: unknown
  name?: unknown
  grams?: unknown
  state?: unknown
  kcal?: unknown
  protein?: unknown
  carbs?: unknown
  fat?: unknown
}

interface RawMeal {
  label?: unknown
  items?: unknown
}

function isFoodState(value: unknown): value is FoodState {
  return value === 'raw' || value === 'cooked'
}

function toPositiveNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function toNonNegativeNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num >= 0 ? num : null
}

const RAW_WORDS = new Set(['cru', 'crue', 'crus', 'crues'])
const COOKED_WORDS = new Set(['cuit', 'cuite', 'cuits', 'cuites'])

/** Devine l'état visé d'après le nom donné par l'assistant (« poulet cuit » → cooked). */
function detectState(name: string): FoodState | undefined {
  const words = normalize(name).split(/\s+/)
  if (words.some((word) => RAW_WORDS.has(word))) return 'raw'
  if (words.some((word) => COOKED_WORDS.has(word))) return 'cooked'
  return undefined
}

/**
 * Résout un item brut du bloc <meals> : soit un foodId déjà connu, soit un
 * nom que l'assistant propose d'ajouter — dans ce dernier cas, on tente
 * d'abord une correspondance exacte dans le catalogue (le modèle ne connaît
 * pas les ~500 aliments intégrés, donc "quinoa" peut très bien déjà exister),
 * puis une recherche de candidats proches (« riz basmati cru » vs « Riz
 * basmati ») à proposer avant de retomber sur une création.
 */
function resolveItem(rawItem: RawMealItem, foods: Food[], lang: Lang): ChatMealItem | null {
  const grams = toPositiveNumber(rawItem?.grams)
  if (grams === null) return null

  if (typeof rawItem?.foodId === 'string') {
    if (!foods.some((food) => food.id === rawItem.foodId)) return null
    return { kind: 'food', foodId: rawItem.foodId, grams: Math.round(grams), state: isFoodState(rawItem?.state) ? rawItem.state : undefined }
  }

  if (typeof rawItem?.name === 'string' && rawItem.name.trim()) {
    const name = rawItem.name.trim()
    const exact = findFoodByExactName(foods, name)
    if (exact) {
      // Un aliment cru et cuit ont des valeurs très différentes pour 100 g : sans
      // ce repérage, "poulet cuit" retombait silencieusement sur l'état par
      // défaut du catalogue (souvent cru), avec des macros fausses à la clé.
      const state = statesOf(exact).length > 0 ? (detectState(name) ?? exact.state) : undefined
      return { kind: 'food', foodId: exact.id, grams: Math.round(grams), state }
    }

    const kcal = toNonNegativeNumber(rawItem.kcal)
    const protein = toNonNegativeNumber(rawItem.protein)
    const carbs = toNonNegativeNumber(rawItem.carbs)
    const fat = toNonNegativeNumber(rawItem.fat)
    if (kcal === null || protein === null || carbs === null || fat === null) return null

    const candidates = findSimilarFoods(foods, name, lang)
    if (candidates.length > 0) {
      return {
        kind: 'suggested',
        name,
        grams: Math.round(grams),
        candidateIds: candidates.map((food) => food.id),
        newFood: { kcal, protein, carbs, fat },
      }
    }
    return { kind: 'newFood', name, grams: Math.round(grams), kcal, protein, carbs, fat }
  }

  return null
}

/**
 * Sépare le texte affichable du bloc <meals> caché que l'assistant ajoute à
 * la fin de sa réponse. Chaque ingrédient est soit un aliment du catalogue
 * (existant ou retrouvé par son nom), soit une proposition de création — un
 * identifiant halluciné ou une entrée malformée fait simplement disparaître
 * cet ingrédient, sans jamais faire échouer l'affichage du reste.
 */
export function extractMealSuggestions(
  raw: string,
  foods: Food[],
  lang: Lang,
): { text: string; meals: ChatMealSuggestion[] } {
  const closed = raw.match(BLOCK_RE)

  if (!closed) {
    // Le bloc a pu être coupé net par la limite de tokens avant sa fermeture :
    // mieux vaut perdre les repas de cette réponse que montrer du JSON brut.
    const text = raw.replace(UNCLOSED_BLOCK_RE, '').trim()
    return { text, meals: [] }
  }

  const jsonBlock = closed[1]
  const text = raw.replace(BLOCK_RE, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonBlock)
  } catch {
    return { text, meals: [] }
  }
  if (!Array.isArray(parsed)) return { text, meals: [] }

  const meals: ChatMealSuggestion[] = []
  for (const entry of parsed as RawMeal[]) {
    if (!entry || typeof entry.label !== 'string' || !Array.isArray(entry.items) || entry.items.length === 0) {
      continue
    }
    const items = (entry.items as RawMealItem[])
      .map((rawItem) => resolveItem(rawItem, foods, lang))
      .filter((item): item is ChatMealItem => item !== null)
    if (items.length > 0) meals.push({ label: entry.label, items })
  }

  return { text, meals }
}

/** Un repas n'est envoyable au journal en un clic que si tous ses ingrédients existent déjà au catalogue. */
export function mealFullyResolved(meal: ChatMealSuggestion): boolean {
  return meal.items.every((item) => item.kind === 'food')
}
