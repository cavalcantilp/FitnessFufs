import type { ChatMealSuggestion, Food, FoodState } from './types'

const BLOCK_RE = /<meals>([\s\S]*?)<\/meals>/gi

interface RawMealItem {
  foodId?: unknown
  grams?: unknown
  state?: unknown
}

interface RawMeal {
  label?: unknown
  items?: unknown
}

function isFoodState(value: unknown): value is FoodState {
  return value === 'raw' || value === 'cooked'
}

/**
 * Sépare le texte affichable du bloc <meals> caché que l'assistant ajoute à
 * la fin de sa réponse, et ne garde que les repas dont chaque aliment
 * référence un identifiant réellement présent au catalogue — un identifiant
 * halluciné ou une entrée malformée fait simplement disparaître ce repas,
 * sans jamais faire échouer l'affichage du reste de la réponse.
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
    const items: ChatMealSuggestion['items'] = []
    let valid = true
    for (const rawItem of entry.items as RawMealItem[]) {
      const foodId = rawItem?.foodId
      const grams = Number(rawItem?.grams)
      if (typeof foodId !== 'string' || !foods.some((food) => food.id === foodId)) {
        valid = false
        break
      }
      if (!Number.isFinite(grams) || grams <= 0) {
        valid = false
        break
      }
      items.push({ foodId, grams: Math.round(grams), state: isFoodState(rawItem?.state) ? rawItem.state : undefined })
    }
    if (valid) meals.push({ label: entry.label, items })
  }

  return { text, meals }
}
