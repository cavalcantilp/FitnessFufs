import type { Food, FoodCategory, Lang, Micros } from './types'

/**
 * Client Open Food Facts — base ouverte (licence ODbL), sans clé d'API,
 * interrogeable directement depuis le navigateur.
 *
 * Elle vient *compléter* la table intégrée, jamais la remplacer : Open Food
 * Facts couvre très bien les produits emballés et mal les aliments bruts, et
 * l'application doit rester utilisable hors ligne. Tout produit retenu par
 * l'utilisateur est recopié dans ses aliments personnels.
 *
 * Les valeurs manquantes sont fréquentes — contributions ouvertes — d'où la
 * lecture défensive de chaque champ.
 */

const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'
/** Recherche plein texte : le service dédié d'abord, l'ancien script en repli. */
const SEARCH_URL = 'https://search.openfoodfacts.org/search'
const LEGACY_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
/** Même hôte et même famille de chemins que la fiche produit, dont on sait qu'elle répond. */
const V2_SEARCH_URL = 'https://world.openfoodfacts.org/api/v2/search'

const PRODUCT_FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'product_name_pt',
  'product_name_es',
  'product_name_it',
  'generic_name',
  'brands',
  'categories_tags',
  'nutriments',
  'serving_quantity',
].join(',')

const TIMEOUT_MS = 8000

interface OffNutriments {
  [key: string]: number | string | undefined
}

interface OffProduct {
  code?: string
  product_name?: string
  generic_name?: string
  brands?: string
  categories_tags?: string[]
  nutriments?: OffNutriments
  serving_quantity?: number | string
  [key: string]: unknown
}

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

/** Nom localisé si le produit en propose un, nom générique sinon. */
function nameOf(product: OffProduct, lang: Lang): string {
  const localized = product[`product_name_${lang}`]
  const candidates = [localized, product.product_name, product.generic_name]
  const found = candidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  ) as string | undefined
  return found?.trim() ?? ''
}

/** Les catégories Open Food Facts sont libres : on ne retient que le grossier. */
function categoryOf(product: OffProduct): FoodCategory {
  const tags = (product.categories_tags ?? []).join(' ')
  const has = (...needles: string[]) => needles.some((needle) => tags.includes(needle))
  if (has('beverages', 'waters', 'juices', 'sodas')) return 'drink'
  if (has('dairies', 'cheeses', 'yogurts', 'milks')) return 'dairy'
  if (has('meats', 'fishes', 'seafood', 'poultry', 'eggs')) return 'protein'
  if (has('fruits')) return 'fruit'
  if (has('vegetables', 'legumes')) return 'veg'
  if (has('breads', 'cereals', 'pastas', 'rice')) return 'carbs'
  if (has('fats', 'oils', 'nuts')) return 'fat'
  if (has('snacks', 'biscuits', 'chocolates', 'confectioneries', 'desserts')) return 'snack'
  if (has('dietary-supplements', 'sports-nutrition')) return 'supplement'
  return 'dish'
}

/**
 * Un produit n'est exploitable que si ses calories pour 100 g sont connues :
 * sans elles, l'entrée fausserait le journal au lieu de l'enrichir.
 */
function toFood(product: OffProduct, lang: Lang): Food | null {
  const name = nameOf(product, lang)
  const n = product.nutriments ?? {}
  const kcal = num(n['energy-kcal_100g'])
  // Certaines fiches ne renseignent que les kilojoules.
  const kcalFromKj = kcal > 0 ? kcal : Math.round(num(n['energy_100g']) / 4.184)
  if (!name || kcalFromKj <= 0) return null

  const brand = typeof product.brands === 'string' ? product.brands.split(',')[0].trim() : ''
  const serving = Math.round(num(product.serving_quantity)) || 100

  // Le sel est déclaré en grammes, le sodium attendu en milligrammes.
  const sodium = num(n.sodium_100g) > 0 ? num(n.sodium_100g) * 1000 : num(n.salt_100g) * 400
  const micros: Micros | undefined =
    sodium > 0 || num(n.calcium_100g) > 0 || num(n.iron_100g) > 0
      ? {
          sodium: Math.round(sodium),
          potassium: num(n.potassium_100g) * 1000,
          calcium: num(n.calcium_100g) * 1000,
          iron: num(n.iron_100g) * 1000,
          magnesium: num(n.magnesium_100g) * 1000,
          zinc: num(n.zinc_100g) * 1000,
          vitaminC: num(n['vitamin-c_100g']) * 1000,
          vitaminD: num(n['vitamin-d_100g']) * 1_000_000,
          vitaminB12: num(n['vitamin-b12_100g']) * 1_000_000,
        }
      : undefined

  return {
    id: `off-${product.code ?? name}`,
    name: brand ? `${name} — ${brand}` : name,
    per100: {
      kcal: Math.round(kcalFromKj),
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
      fiber: num(n.fiber_100g),
    },
    serving,
    category: categoryOf(product),
    custom: true,
    source: 'off',
    brand: brand || undefined,
    barcode: typeof product.code === 'string' ? product.code : undefined,
    micros,
  }
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** Les deux services de recherche ne nomment pas leur tableau de la même façon. */
function productsOf(payload: unknown): OffProduct[] {
  if (typeof payload !== 'object' || payload === null) return []
  const data = payload as { products?: unknown; hits?: unknown }
  const list = Array.isArray(data.products) ? data.products : Array.isArray(data.hits) ? data.hits : []
  return list as OffProduct[]
}

/** Signale que tous les services ont échoué, ce qui n'est pas « zéro résultat ». */
export class OpenFoodFactsError extends Error {
  /** Cause renvoyée par chaque tentative, pour pouvoir diagnostiquer. */
  constructor(public readonly details: string[]) {
    super(`Open Food Facts unreachable: ${details.join(' / ')}`)
  }
}

/**
 * Deux services de recherche coexistent chez Open Food Facts et l'ancien est
 * progressivement retiré : on tente le nouveau puis l'ancien.
 *
 * Aucun paramètre `fields` n'est envoyé ici. Il allégerait les réponses, mais
 * un nom de champ non reconnu fait échouer la requête entière — un compromis
 * défavorable pour une recherche qui doit d'abord fonctionner.
 */
function searchUrls(term: string, lang: Lang): string[] {
  const q = encodeURIComponent(term)
  return [
    // L'hôte world.* répond aux fiches produit ; on l'essaie d'abord pour la
    // recherche, plutôt qu'un sous-domaine dédié dont rien ne garantit qu'il
    // autorise les requêtes depuis une autre origine.
    `${V2_SEARCH_URL}?search_terms=${q}&page_size=25`,
    `${LEGACY_SEARCH_URL}?search_terms=${q}&search_simple=1&action=process&json=1&page_size=25`,
    `${SEARCH_URL}?q=${q}&langs=${lang}&page_size=25`,
  ]
}

export async function searchOpenFoodFacts(
  query: string,
  lang: Lang,
  signal?: AbortSignal,
): Promise<Food[]> {
  const term = query.trim()
  if (term.length < 3) return []

  let reached = false
  const failures: string[] = []
  for (const url of searchUrls(term, lang)) {
    try {
      const products = productsOf(await getJson(url, signal))
      reached = true
      const foods = products
        .map((product) => toFood(product, lang))
        .filter((food): food is Food => food !== null)
      if (foods.length > 0) return foods
    } catch (error) {
      // Service indisponible ou format inattendu : on tente le suivant.
      if (signal?.aborted) throw error
      const host = new URL(url).host
      const cause = error instanceof Error ? error.message : String(error)
      // Un « Failed to fetch » sans code HTTP signe presque toujours un refus
      // CORS : le navigateur bloque la réponse avant qu'on puisse la lire.
      failures.push(`${host}: ${cause}`)
    }
  }

  // Aucun service n'a répondu : le dire, plutôt que d'annoncer « zéro produit ».
  if (!reached) throw new OpenFoodFactsError(failures)
  return []
}

export async function fetchByBarcode(
  barcode: string,
  lang: Lang,
  signal?: AbortSignal,
): Promise<Food | null> {
  const code = barcode.replace(/\D/g, '')
  if (!code) return null
  const payload = (await getJson(`${PRODUCT_URL}/${code}.json?fields=${PRODUCT_FIELDS}`, signal)) as {
    status?: number
    product?: OffProduct
  }
  if (!payload?.product) return null
  return toFood({ code, ...payload.product }, lang)
}
