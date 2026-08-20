import { findFoodByExactName } from './foods'
import type { ChatMealItem, ChatMealSuggestion, Food, FoodState } from './types'

const BLOCK_RE = /<meals>([\s\S]*?)<\/meals>/gi

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

/**
 * Résout un item brut du bloc <meals> : soit un foodId déjà connu, soit un
 * nom que l'assistant propose d'ajouter — dans ce dernier cas, on tente
 * d'abord une correspondance exacte dans le catalogue (le modèle ne connaît
 * pas les ~500 aliments intégrés, donc "quinoa" peut très bien déjà exister)
 * avant de retomber sur une proposition de création.
 */
function resolveItem(rawItem: RawMealItem, foods: Food[]): ChatMealItem | null {
  const grams = toPositiveNumber(rawItem?.grams)
  if (grams === null) return null

  if (typeof rawItem?.foodId === 'string') {
    if (!foods.some((food) => food.id === rawItem.foodId)) return null
    return { kind: 'food', foodId: rawItem.foodId, grams: Math.round(grams), state: isFoodState(rawItem?.state) ? rawItem.state : undefined }
  }

  if (typeof rawItem?.name === 'string' && rawItem.name.trim()) {
    const match = findFoodByExactName(foods, rawItem.name)
    if (match) return { kind: 'food', foodId: match.id, grams: Math.round(grams), state: undefined }

    const kcal = toNonNegativeNumber(rawItem.kcal)
    const protein = toNonNegativeNumber(rawItem.protein)
    const carbs = toNonNegativeNumber(rawItem.carbs)
    const fat = toNonNegativeNumber(rawItem.fat)
    if (kcal === null || protein === null || carbs === null || fat === null) return null
    return { kind: 'newFood', name: rawItem.name.trim(), grams: Math.round(grams), kcal, protein, carbs, fat }
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
export function extractMealSuggestions(raw: string, foods: Food[]): { text: string; meals: ChatMealSuggestion[] } {
  let jsonBlock: string | null = null
  const text = raw
    .replace(BLOCK_RE, (_match, inner: string) => {
      if (jsonBlock === null) jsonBlock = inner
      return ''
    })
    .trim()

  if (jsonBlock === null) return { text, meals: [] }

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
      .map((rawItem) => resolveItem(rawItem, foods))
      .filter((item): item is ChatMealItem => item !== null)
    if (items.length > 0) meals.push({ label: entry.label, items })
  }

  return { text, meals }
}

/** Un repas n'est envoyable au journal en un clic que si tous ses ingrédients existent déjà au catalogue. */
export function mealFullyResolved(meal: ChatMealSuggestion): boolean {
  return meal.items.every((item) => item.kind === 'food')
}
