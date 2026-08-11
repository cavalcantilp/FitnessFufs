import type { Food, FoodCategory, FoodState, Lang, Micros, PortionUnit } from './types'

/** Libellés dans l'ordre : fr, pt, es, en, it. */
type Names = [string, string, string, string, string]

/** Valeurs d'un état : kcal, protéines, glucides, lipides, fibres, portion usuelle. */
type Vals = [number, number, number, number, number, number]

/**
 * Micronutriments dans l'ordre : sodium, potassium, calcium, fer, magnésium,
 * zinc, vitamine C, vitamine D, vitamine B12.
 */
type MicroVals = [number, number, number, number, number, number, number, number, number]

const LANG_ORDER: Lang[] = ['fr', 'pt', 'es', 'en', 'it']

function labels(names: Names): Partial<Record<Lang, string>> {
  const i18n: Partial<Record<Lang, string>> = {}
  LANG_ORDER.forEach((lang, index) => {
    i18n[lang] = names[index]
  })
  return i18n
}

function micros(values?: MicroVals): Micros | undefined {
  if (!values) return undefined
  const [sodium, potassium, calcium, iron, magnesium, zinc, vitaminC, vitaminD, vitaminB12] = values
  return { sodium, potassium, calcium, iron, magnesium, zinc, vitaminC, vitaminD, vitaminB12 }
}

/** Aliment à état unique : ce qu'on pèse est ce qu'on mange. */
function food(
  id: string,
  names: Names,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  serving: number,
  category: FoodCategory,
  microValues?: MicroVals,
): Food {
  return {
    id,
    name: names[0],
    i18n: labels(names),
    per100: { kcal, protein, carbs, fat, fiber },
    serving,
    category,
    micros: micros(microValues),
  }
}

/**
 * Aliment pesable cru ou cuit. La cuisson change le poids sans changer la
 * matière : 100 g de riz cru donnent ~280 g de riz cuit, 100 g de poulet cru
 * ~70 g de poulet cuit. Les valeurs pour 100 g diffèrent donc du tout au tout.
 *
 * `defaultState` reflète l'usage courant : on pèse les féculents et légumineuses
 * dans l'assiette, les viandes et poissons au moment de les acheter ou de les
 * cuisiner. Les micronutriments valent pour l'état par défaut.
 */
function food2(
  id: string,
  names: Names,
  category: FoodCategory,
  defaultState: FoodState,
  raw: Vals,
  cooked: Vals,
  microValues?: MicroVals,
): Food {
  const asPortion = ([kcal, protein, carbs, fat, fiber, serving]: Vals) => ({
    per100: { kcal, protein, carbs, fat, fiber },
    serving,
  })
  const main = asPortion(defaultState === 'raw' ? raw : cooked)
  return {
    id,
    name: names[0],
    i18n: labels(names),
    per100: main.per100,
    serving: main.serving,
    state: defaultState,
    alt: asPortion(defaultState === 'raw' ? cooked : raw),
    category,
    micros: micros(microValues),
  }
}

/**
 * Base d'aliments intégrée. Valeurs pour 100 g (ou 100 ml pour les boissons),
 * arrondies à partir des tables de composition usuelles (Ciqual, USDA, TACO).
 *
 * Les micronutriments ne sont renseignés que sur les aliments bruts, dont la
 * composition est établie. Plats composés, viennoiseries, produits industriels
 * et compléments en sont dépourvus : mieux vaut un panneau vide qu'un chiffre
 * inventé.
 */
export const BUILTIN_FOODS: Food[] = [
  // ---------- Viandes ----------
  food2('chicken_breast', ['Blanc de poulet', 'Peito de frango', 'Pechuga de pollo', 'Chicken breast', 'Petto di pollo'], 'protein', 'raw', [120, 22.5, 0, 2.6, 0, 150], [165, 31, 0, 3.6, 0, 120], [65, 334, 5, 0.4, 29, 0.7, 0, 0.1, 0.3]),
  food2('chicken_thigh', ['Cuisse de poulet', 'Coxa de frango', 'Muslo de pollo', 'Chicken thigh', 'Coscia di pollo'], 'protein', 'raw', [150, 18, 0, 8.5, 0, 160], [209, 26, 0, 11, 0, 130], [86, 230, 8, 0.9, 21, 1.5, 0, 0.1, 0.6]),
  food('chicken_roast', ['Poulet rôti (avec peau)', 'Frango assado (com pele)', 'Pollo asado (con piel)', 'Roast chicken with skin', 'Pollo arrosto con pelle'], 220, 27, 0, 12, 0, 150, 'protein', [90, 250, 12, 1, 22, 1.8, 0, 0.2, 0.4]),
  food2('turkey', ['Escalope de dinde', 'Peito de peru', 'Pechuga de pavo', 'Turkey breast', 'Fesa di tacchino'], 'protein', 'raw', [104, 22, 0, 1.2, 0, 150], [135, 29, 0, 1.5, 0, 120], [60, 300, 8, 0.7, 28, 1.2, 0, 0.1, 1]),
  food2('beef_mince', ['Bœuf haché 5 %', 'Carne moída 5 %', 'Carne picada 5 %', 'Lean beef mince 5%', 'Macinato di manzo 5%'], 'protein', 'raw', [137, 21, 0, 5, 0, 150], [190, 28, 0, 8, 0, 120], [66, 318, 12, 2.2, 21, 4.8, 0, 0.1, 2.2]),
  food2('steak', ['Steak de bœuf', 'Bife de vaca', 'Filete de ternera', 'Beef steak', 'Bistecca di manzo'], 'protein', 'raw', [155, 22, 0, 7.5, 0, 180], [217, 26, 0, 12, 0, 150], [55, 330, 6, 2, 22, 4.2, 0, 0.1, 2]),
  food2('picanha', ['Picanha', 'Picanha', 'Picaña', 'Picanha (rump cap)', 'Picanha'], 'protein', 'raw', [190, 21, 0, 12, 0, 180], [250, 27, 0, 16, 0, 150], [55, 320, 6, 2.1, 21, 4.5, 0, 0.1, 2.1]),
  food2('pork_loin', ['Filet de porc', 'Lombo de porco', 'Lomo de cerdo', 'Pork loin', 'Lombo di maiale'], 'protein', 'raw', [120, 21, 0, 3.5, 0, 150], [165, 28, 0, 5.5, 0, 120], [50, 380, 7, 0.8, 26, 1.9, 0.6, 0.7, 0.6]),
  food2('lamb', ["Côtelette d'agneau", 'Costeleta de borrego', 'Chuleta de cordero', 'Lamb chop', 'Costoletta di agnello'], 'protein', 'raw', [230, 17, 0, 18, 0, 180], [294, 25, 0, 21, 0, 150], [70, 250, 12, 1.6, 20, 3.4, 0, 0.1, 2.3]),
  food2('duck', ['Magret de canard', 'Peito de pato', 'Magret de pato', 'Duck breast', 'Petto di anatra'], 'protein', 'raw', [200, 18, 0, 14, 0, 180], [240, 24, 0, 16, 0, 150], [74, 270, 11, 2.4, 19, 1.9, 5, 0.2, 0.3]),
  food2('veal', ['Escalope de veau', 'Escalope de vitela', 'Escalope de ternera', 'Veal escalope', 'Scaloppina di vitello'], 'protein', 'raw', [110, 21, 0, 2.5, 0, 150], [150, 29, 0, 3.5, 0, 130], [90, 360, 8, 1, 25, 3.2, 0, 0.1, 1.5]),
  food2('liver', ['Foie de volaille', 'Fígado de frango', 'Hígado de pollo', 'Chicken liver', 'Fegato di pollo'], 'protein', 'raw', [116, 20, 3, 4, 0, 120], [165, 26, 4, 6, 0, 100], [71, 230, 8, 9, 19, 2.7, 18, 0.2, 16.6]),
  food2('sausage', ['Saucisse / chipolata', 'Salsicha fresca', 'Salchicha fresca', 'Pork sausage', 'Salsiccia'], 'protein', 'raw', [280, 13, 2, 24, 0, 120], [320, 16, 2, 28, 0, 100], [800, 220, 20, 1, 15, 1.6, 0, 0.3, 0.8]),
  food('merguez', ['Merguez', 'Merguez', 'Merguez', 'Merguez sausage', 'Merguez'], 300, 14, 1.5, 27, 0, 100, 'protein', [900, 230, 25, 1.5, 18, 2.5, 0, 0.2, 1.5]),
  food2('bacon', ['Bacon / lardons', 'Bacon', 'Bacon', 'Bacon', 'Pancetta'], 'protein', 'raw', [250, 15, 1, 21, 0, 50], [330, 24, 1, 26, 0, 30], [1200, 250, 6, 0.6, 15, 1.4, 0, 0.4, 0.6]),
  food('ham', ['Jambon blanc', 'Fiambre', 'Jamón cocido', 'Cooked ham', 'Prosciutto cotto'], 107, 18, 1, 3.5, 0, 40, 'protein', [1100, 300, 8, 0.8, 18, 1.5, 0, 0.5, 0.6]),
  food('cured_ham', ['Jambon cru / Parme', 'Presunto', 'Jamón serrano', 'Cured ham', 'Prosciutto crudo'], 268, 30, 0.3, 16, 0, 30, 'protein', [2300, 500, 12, 1.5, 28, 2.5, 0, 0.6, 1]),
  food('chorizo', ['Chorizo', 'Chouriço', 'Chorizo', 'Chorizo', 'Chorizo'], 455, 24, 2, 38, 0, 30, 'protein', [1600, 400, 15, 1.5, 20, 3, 0, 0.5, 2]),
  food('rillettes', ['Rillettes', 'Rillettes', 'Rillettes', 'Rillettes', 'Rillettes'], 400, 15, 0, 38, 0, 30, 'protein', [800, 180, 10, 1.2, 12, 1.6, 0, 0.4, 0.8]),

  // ---------- Poissons et fruits de mer ----------
  food2('salmon', ['Saumon', 'Salmão', 'Salmón', 'Salmon', 'Salmone'], 'protein', 'raw', [180, 20, 0, 11, 0, 150], [208, 22, 0, 13, 0, 130], [60, 380, 12, 0.4, 29, 0.4, 0, 10, 3.2]),
  food('smoked_salmon', ['Saumon fumé', 'Salmão fumado', 'Salmón ahumado', 'Smoked salmon', 'Salmone affumicato'], 180, 23, 0, 9, 0, 50, 'protein', [1900, 350, 11, 0.9, 22, 0.4, 0, 8, 3.3]),
  food2('cod', ['Cabillaud', 'Bacalhau fresco', 'Bacalao fresco', 'Cod', 'Merluzzo'], 'protein', 'raw', [82, 18, 0, 0.7, 0, 150], [105, 23, 0, 0.9, 0, 130], [78, 400, 16, 0.4, 28, 0.4, 1, 1, 1]),
  food('salt_cod', ['Morue dessalée', 'Bacalhau demolhado', 'Bacalao desalado', 'Salt cod, soaked', 'Baccalà ammollato'], 135, 29, 0, 1.5, 0, 130, 'protein', [1200, 450, 40, 0.9, 35, 0.9, 0, 1, 1.5]),
  food2('tuna_fresh', ['Thon frais', 'Atum fresco', 'Atún fresco', 'Fresh tuna', 'Tonno fresco'], 'protein', 'raw', [144, 23, 0, 5, 0, 150], [184, 30, 0, 6, 0, 130], [40, 350, 8, 1, 50, 0.6, 0, 5, 9.4]),
  food('tuna_can', ['Thon au naturel', 'Atum ao natural', 'Atún al natural', 'Canned tuna in water', 'Tonno al naturale'], 116, 26, 0, 1, 0, 80, 'protein', [320, 240, 12, 1, 30, 0.6, 0, 2, 2.5]),
  food2('sardine', ['Sardine fraîche', 'Sardinha fresca', 'Sardina fresca', 'Fresh sardine', 'Sardina fresca'], 'protein', 'raw', [165, 20, 0, 9, 0, 120], [208, 25, 0, 11, 0, 100], [90, 400, 90, 1.5, 30, 1.3, 0, 11, 8.9]),
  food('sardine_can', ["Sardines à l'huile", 'Sardinhas em azeite', 'Sardinas en aceite', 'Sardines in oil', 'Sardine sott olio'], 208, 24, 0, 12, 0, 60, 'protein', [400, 400, 330, 2.5, 35, 1.4, 0, 7, 8.9]),
  food2('mackerel', ['Maquereau', 'Cavala', 'Caballa', 'Mackerel', 'Sgombro'], 'protein', 'raw', [190, 19, 0, 12, 0, 150], [262, 24, 0, 18, 0, 130], [80, 340, 12, 1.6, 76, 0.6, 0.4, 8, 8.7]),
  food2('trout', ['Truite', 'Truta', 'Trucha', 'Trout', 'Trota'], 'protein', 'raw', [119, 20, 0, 3.5, 0, 150], [148, 21, 0, 6.6, 0, 130], [50, 400, 25, 0.3, 28, 0.7, 2, 12, 4.5]),
  food2('sea_bream', ['Dorade', 'Dourada', 'Dorada', 'Sea bream', 'Orata'], 'protein', 'raw', [96, 20, 0, 1.5, 0, 180], [125, 26, 0, 2, 0, 150], [80, 400, 30, 0.4, 30, 0.5, 0, 3, 1.5]),
  food2('sea_bass', ['Bar / loup', 'Robalo', 'Lubina', 'Sea bass', 'Branzino'], 'protein', 'raw', [97, 18, 0, 2, 0, 180], [124, 23, 0, 2.6, 0, 150], [70, 350, 20, 0.3, 30, 0.5, 0, 3, 1.5]),
  food('herring', ['Hareng', 'Arenque', 'Arenque', 'Herring', 'Aringa'], 158, 18, 0, 9, 0, 100, 'protein', [90, 330, 60, 1.1, 32, 1, 0.7, 19, 13.7]),
  food2('shrimp', ['Crevettes', 'Camarão', 'Gambas', 'Shrimp', 'Gamberi'], 'protein', 'raw', [85, 20, 0.2, 0.5, 0, 120], [99, 24, 0.2, 0.3, 0, 100], [220, 260, 70, 0.5, 40, 1.3, 0, 0.1, 1.1]),
  food('squid', ['Calamar grillé', 'Lulas grelhadas', 'Calamar a la plancha', 'Grilled squid', 'Calamari alla griglia'], 110, 19, 3, 1.8, 0, 150, 'protein', [230, 250, 32, 0.7, 33, 1.5, 4, 0.3, 1.3]),
  food('mussels', ['Moules cuites', 'Mexilhões cozidos', 'Mejillones cocidos', 'Cooked mussels', 'Cozze cotte'], 172, 24, 7, 4.5, 0, 150, 'protein', [370, 270, 33, 6.7, 37, 2.7, 13, 0.2, 24]),
  food('crab', ['Crabe', 'Caranguejo', 'Cangrejo', 'Crab', 'Granchio'], 84, 18, 0, 1, 0, 100, 'protein', [400, 330, 60, 0.7, 40, 4, 3, 0.1, 9]),

  // ---------- Œufs et végétal ----------
  food('egg', ['Œuf entier', 'Ovo inteiro', 'Huevo entero', 'Whole egg', 'Uovo intero'], 143, 13, 0.7, 9.5, 0, 55, 'protein', [140, 138, 56, 1.8, 12, 1.3, 0, 2, 1.1]),
  food('egg_white', ["Blanc d'œuf", 'Clara de ovo', 'Clara de huevo', 'Egg white', "Albume d'uovo"], 52, 11, 0.7, 0.2, 0, 33, 'protein', [166, 163, 7, 0.1, 11, 0, 0, 0, 0.1]),
  food('tofu', ['Tofu ferme', 'Tofu firme', 'Tofu firme', 'Firm tofu', 'Tofu compatto'], 144, 15, 3, 8, 0.9, 100, 'protein', [12, 120, 350, 2.7, 60, 1.6, 0.1, 0, 0]),
  food2('lentils', ['Lentilles', 'Lentilhas', 'Lentejas', 'Lentils', 'Lenticchie'], 'protein', 'cooked', [353, 25, 60, 1.1, 30.5, 60], [116, 9, 20, 0.4, 7.9, 150], [2, 370, 19, 3.3, 36, 1.3, 1.5, 0, 0]),
  food2('chickpeas', ['Pois chiches', 'Grão-de-bico', 'Garbanzos', 'Chickpeas', 'Ceci'], 'protein', 'cooked', [364, 19, 61, 6, 17, 60], [164, 8.9, 27, 2.6, 7.6, 150], [7, 290, 49, 2.9, 48, 1.5, 1.3, 0, 0]),
  food2('kidney_beans', ['Haricots rouges', 'Feijão vermelho', 'Alubias rojas', 'Kidney beans', 'Fagioli rossi'], 'protein', 'cooked', [333, 24, 60, 0.8, 25, 60], [127, 8.7, 22.8, 0.5, 6.4, 150], [2, 400, 35, 2.2, 45, 1, 1.2, 0, 0]),
  food2('black_beans', ['Haricots noirs', 'Feijão preto', 'Frijoles negros', 'Black beans', 'Fagioli neri'], 'protein', 'cooked', [341, 21, 62, 1.4, 15.5, 60], [132, 8.9, 24, 0.5, 8.7, 150], [2, 355, 27, 2.1, 70, 1.1, 0, 0, 0]),
  food('feijao_carioca', ['Feijão carioca cuit', 'Feijão carioca cozido', 'Frijol carioca cocido', 'Cooked carioca beans', 'Fagioli carioca cotti'], 76, 4.8, 13.6, 0.5, 5.5, 150, 'protein', [2, 250, 27, 1.3, 40, 0.7, 0, 0, 0]),

  // ---------- Produits laitiers ----------
  food('milk_semi', ['Lait demi-écrémé', 'Leite meio-gordo', 'Leche semidesnatada', 'Semi-skimmed milk', 'Latte parzialmente scremato'], 46, 3.4, 4.8, 1.6, 0, 200, 'dairy', [44, 150, 120, 0.05, 11, 0.4, 1, 0.05, 0.4]),
  food('yogurt_plain', ['Yaourt nature', 'Iogurte natural', 'Yogur natural', 'Plain yogurt', 'Yogurt bianco'], 61, 3.5, 4.7, 3.3, 0, 125, 'dairy', [46, 155, 120, 0.05, 12, 0.6, 0.5, 0.05, 0.4]),
  food('skyr', ['Skyr / fromage blanc 0 %', 'Skyr / queijo quark 0 %', 'Skyr / queso batido 0 %', 'Skyr / fat-free quark', 'Skyr / fiocchi magri'], 63, 11, 4, 0.2, 0, 150, 'dairy', [45, 150, 110, 0.1, 11, 0.5, 0, 0, 0.5]),
  food('greek_yogurt', ['Yaourt grec', 'Iogurte grego', 'Yogur griego', 'Greek yogurt', 'Yogurt greco'], 97, 9, 3.6, 5, 0, 150, 'dairy', [35, 140, 100, 0.05, 11, 0.5, 0, 0, 0.5]),
  food('cottage', ['Cottage cheese', 'Queijo cottage', 'Requesón', 'Cottage cheese', 'Fiocchi di latte'], 98, 11, 3.4, 4.3, 0, 100, 'dairy', [320, 100, 80, 0.1, 8, 0.4, 0, 0, 0.4]),
  food('requeijao', ['Requeijão', 'Requeijão', 'Requesón cremoso', 'Requeijão spread', 'Formaggio spalmabile'], 250, 8, 4, 23, 0, 30, 'dairy', [400, 100, 200, 0.1, 10, 0.5, 0, 0.2, 0.3]),

  // ---------- Fromages ----------
  food('emmental', ['Emmental', 'Queijo emmental', 'Queso emmental', 'Emmental', 'Emmental'], 380, 27, 1.5, 29, 0, 30, 'dairy', [300, 100, 1000, 0.3, 35, 4, 0, 0.5, 2.2]),
  food('comte', ['Comté', 'Queijo comté', 'Queso comté', 'Comté', 'Comté'], 417, 28, 0.5, 34, 0, 30, 'dairy', [500, 90, 950, 0.2, 40, 4.4, 0, 0.6, 2]),
  food('beaufort', ['Beaufort', 'Queijo beaufort', 'Queso beaufort', 'Beaufort', 'Beaufort'], 401, 26, 1.5, 33, 0, 30, 'dairy', [550, 95, 1000, 0.2, 38, 4.2, 0, 0.6, 2]),
  food('cantal', ['Cantal', 'Queijo cantal', 'Queso cantal', 'Cantal', 'Cantal'], 369, 24, 1.5, 30, 0, 30, 'dairy', [700, 90, 800, 0.3, 30, 3.5, 0, 0.5, 1.5]),
  food('tomme', ['Tomme de Savoie', 'Tomme de Savoie', 'Tomme de Savoie', 'Tomme de Savoie', 'Tomme de Savoie'], 300, 24, 0.5, 23, 0, 30, 'dairy', [600, 90, 750, 0.3, 28, 3.2, 0, 0.4, 1.4]),
  food('mimolette', ['Mimolette', 'Mimolette', 'Mimolette', 'Mimolette', 'Mimolette'], 366, 25, 0, 29, 0, 30, 'dairy', [700, 90, 780, 0.3, 28, 3.5, 0, 0.5, 1.5]),
  food('camembert', ['Camembert', 'Camembert', 'Camembert', 'Camembert', 'Camembert'], 299, 20, 0.5, 24, 0, 30, 'dairy', [850, 130, 400, 0.3, 20, 2.4, 0, 0.4, 1.3]),
  food('brie', ['Brie', 'Brie', 'Brie', 'Brie', 'Brie'], 334, 21, 0.5, 28, 0, 30, 'dairy', [700, 150, 250, 0.5, 20, 2.4, 0, 0.5, 1.6]),
  food('reblochon', ['Reblochon', 'Reblochon', 'Reblochon', 'Reblochon', 'Reblochon'], 330, 20, 1, 27, 0, 30, 'dairy', [550, 110, 550, 0.2, 25, 3, 0, 0.4, 1.2]),
  food('munster', ['Munster', 'Munster', 'Munster', 'Munster', 'Munster'], 330, 21, 1, 27, 0, 30, 'dairy', [800, 110, 500, 0.3, 22, 2.8, 0, 0.4, 1.5]),
  food('saint_nectaire', ['Saint-Nectaire', 'Saint-Nectaire', 'Saint-Nectaire', 'Saint-Nectaire', 'Saint-Nectaire'], 341, 22, 1.5, 28, 0, 30, 'dairy', [600, 100, 600, 0.2, 25, 3, 0, 0.4, 1.3]),
  food('raclette', ['Raclette', 'Queijo raclette', 'Queso raclette', 'Raclette', 'Raclette'], 357, 23, 1.5, 29, 0, 40, 'dairy', [700, 100, 750, 0.2, 30, 3.5, 0, 0.5, 1.6]),
  food('roquefort', ['Roquefort', 'Roquefort', 'Roquefort', 'Roquefort', 'Roquefort'], 369, 22, 2, 31, 0, 30, 'dairy', [1600, 90, 660, 0.6, 30, 2.9, 0, 0.5, 0.6]),
  food('gorgonzola', ['Bleu / gorgonzola', 'Gorgonzola', 'Queso azul', 'Blue cheese', 'Gorgonzola'], 353, 21, 2.3, 29, 0, 30, 'dairy', [1400, 100, 530, 0.3, 25, 2.7, 0, 0.5, 1.2]),
  food('goat_fresh', ['Chèvre frais', 'Queijo de cabra fresco', 'Queso de cabra fresco', 'Fresh goat cheese', 'Caprino fresco'], 268, 18, 3, 21, 0, 30, 'dairy', [400, 130, 140, 1.6, 15, 0.9, 0, 0.3, 0.2]),
  food('goat_aged', ['Chèvre affiné', 'Queijo de cabra curado', 'Queso de cabra curado', 'Aged goat cheese', 'Caprino stagionato'], 364, 22, 2.5, 30, 0, 30, 'dairy', [800, 150, 900, 1.9, 30, 1.6, 0, 0.5, 0.4]),
  food('mozzarella', ['Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella'], 254, 18, 3, 19, 0, 60, 'dairy', [400, 80, 500, 0.2, 20, 2.9, 0, 0.4, 1]),
  food('burrata', ['Burrata', 'Burrata', 'Burrata', 'Burrata', 'Burrata'], 330, 15, 2.5, 29, 0, 60, 'dairy', [350, 80, 400, 0.2, 18, 2.5, 0, 0.4, 0.9]),
  food('parmesan', ['Parmesan', 'Queijo parmesão', 'Queso parmesano', 'Parmesan', 'Parmigiano Reggiano'], 402, 36, 3.2, 26, 0, 20, 'dairy', [1600, 90, 1180, 0.8, 44, 3.7, 0, 0.5, 1.2]),
  food('pecorino', ['Pecorino', 'Pecorino', 'Pecorino', 'Pecorino', 'Pecorino'], 387, 26, 3.5, 30, 0, 20, 'dairy', [1800, 90, 1100, 0.5, 40, 3.5, 0, 0.5, 1.5]),
  food('ricotta', ['Ricotta', 'Ricotta', 'Ricotta', 'Ricotta', 'Ricotta'], 174, 11, 3, 13, 0, 60, 'dairy', [100, 110, 210, 0.4, 11, 1.2, 0, 0.3, 0.3]),
  food('mascarpone', ['Mascarpone', 'Mascarpone', 'Mascarpone', 'Mascarpone', 'Mascarpone'], 429, 4.5, 4.5, 44, 0, 30, 'dairy', [40, 60, 100, 0.1, 5, 0.4, 0, 0.6, 0.2]),
  food('feta', ['Feta', 'Queijo feta', 'Queso feta', 'Feta', 'Feta'], 264, 14, 4, 21, 0, 40, 'dairy', [1100, 60, 490, 0.7, 19, 2.9, 0, 0.4, 1.7]),
  food('halloumi', ['Halloumi', 'Halloumi', 'Halloumi', 'Halloumi', 'Halloumi'], 321, 22, 2.4, 25, 0, 60, 'dairy', [1200, 80, 700, 0.4, 25, 2.5, 0, 0.3, 1]),
  food('manchego', ['Manchego', 'Queijo manchego', 'Queso manchego', 'Manchego', 'Manchego'], 393, 25, 2, 32, 0, 30, 'dairy', [1200, 90, 850, 0.4, 30, 3, 0, 0.5, 1.5]),
  food('gouda', ['Gouda', 'Queijo gouda', 'Queso gouda', 'Gouda', 'Gouda'], 356, 25, 2.2, 27, 0, 30, 'dairy', [820, 120, 700, 0.2, 29, 3.9, 0, 0.5, 1.5]),
  food('edam', ['Edam', 'Queijo edam', 'Queso edam', 'Edam', 'Edam'], 357, 25, 1.4, 28, 0, 30, 'dairy', [900, 100, 730, 0.2, 30, 3.8, 0, 0.5, 1.5]),
  food('cheddar', ['Cheddar', 'Queijo cheddar', 'Queso cheddar', 'Cheddar', 'Cheddar'], 403, 25, 1.3, 33, 0, 30, 'dairy', [620, 98, 720, 0.7, 28, 3.1, 0, 0.6, 1.1]),
  food('cream_cheese', ['Fromage à tartiner', 'Queijo creme', 'Queso para untar', 'Cream cheese', 'Formaggio spalmabile'], 253, 6, 4, 24, 0, 30, 'dairy', [320, 130, 100, 0.1, 9, 0.5, 0, 0.6, 0.2]),
  food('processed_cheese', ['Fromage fondu (portion)', 'Queijo fundido', 'Queso fundido', 'Processed cheese', 'Formaggino'], 271, 11, 6, 22, 0, 20, 'dairy', [1300, 130, 400, 0.3, 18, 2, 0, 0.4, 0.8]),

  // ---------- Féculents ----------
  food2('rice_white', ['Riz blanc', 'Arroz branco', 'Arroz blanco', 'White rice', 'Riso bianco'], 'carbs', 'cooked', [365, 7.1, 80, 0.7, 1.3, 60], [130, 2.7, 28, 0.3, 0.4, 150], [1, 35, 10, 0.2, 12, 0.5, 0, 0, 0]),
  food2('rice_brown', ['Riz complet', 'Arroz integral', 'Arroz integral', 'Brown rice', 'Riso integrale'], 'carbs', 'cooked', [370, 7.9, 77, 2.9, 3.5, 60], [123, 2.7, 26, 1, 1.6, 150], [4, 86, 10, 0.4, 44, 0.6, 0, 0, 0]),
  food2('pasta', ['Pâtes', 'Massa', 'Pasta', 'Pasta', 'Pasta'], 'carbs', 'cooked', [371, 13, 75, 1.5, 3.2, 80], [158, 5.8, 31, 0.9, 1.8, 180], [5, 44, 7, 0.5, 18, 0.5, 0, 0, 0]),
  food2('quinoa', ['Quinoa', 'Quinoa', 'Quinoa', 'Quinoa', 'Quinoa'], 'carbs', 'cooked', [368, 14, 64, 6, 7, 60], [120, 4.4, 21, 1.9, 2.8, 150], [7, 172, 17, 1.5, 64, 1.1, 0, 0, 0]),
  food2('couscous', ['Semoule / couscous', 'Cuscuz', 'Cuscús', 'Couscous', 'Cuscus'], 'carbs', 'cooked', [376, 13, 77, 0.6, 5, 60], [112, 3.8, 23, 0.2, 1.4, 180], [5, 58, 8, 0.4, 8, 0.3, 0, 0, 0]),
  food2('oats', ["Flocons d'avoine", 'Flocos de aveia', 'Copos de avena', 'Rolled oats', "Fiocchi d'avena"], 'carbs', 'raw', [379, 13, 68, 6.5, 10.6, 50], [71, 2.4, 12, 1.4, 1.7, 250], [2, 429, 54, 4.7, 177, 4, 0, 0, 0]),
  food2('potato', ['Pomme de terre', 'Batata', 'Patata', 'Potato', 'Patata'], 'carbs', 'cooked', [77, 2, 17, 0.1, 2.2, 220], [87, 2, 20, 0.1, 1.8, 200], [5, 379, 8, 0.3, 20, 0.3, 13, 0, 0]),
  food2('sweet_potato', ['Patate douce', 'Batata-doce', 'Boniato', 'Sweet potato', 'Patata dolce'], 'carbs', 'cooked', [86, 1.6, 20, 0.1, 3, 220], [90, 2, 21, 0.1, 3.3, 200], [27, 475, 27, 0.7, 18, 0.3, 13, 0, 0]),
  food2('cassava', ['Manioc', 'Mandioca', 'Yuca', 'Cassava', 'Manioca'], 'carbs', 'cooked', [160, 1.4, 38, 0.3, 1.8, 170], [125, 0.6, 30, 0.3, 1.8, 150], [14, 271, 16, 0.3, 21, 0.3, 20, 0, 0]),
  food('bread_whole', ['Pain complet', 'Pão integral', 'Pan integral', 'Wholemeal bread', 'Pane integrale'], 247, 13, 41, 3.4, 7, 50, 'carbs', [450, 250, 60, 2.5, 80, 1.8, 0, 0, 0]),
  food('baguette', ['Baguette / pain blanc', 'Pão branco', 'Pan blanco', 'White bread', 'Pane bianco'], 274, 9, 55, 1.5, 2.7, 50, 'carbs', [500, 120, 30, 1.2, 25, 0.7, 0, 0, 0]),
  food('pao_frances', ['Pain français (pãozinho)', 'Pão francês', 'Pan francés', 'Brazilian bread roll', 'Panino brasiliano'], 300, 8, 58, 3, 2.3, 50, 'carbs', [550, 120, 35, 1.5, 25, 0.7, 0, 0, 0]),
  food('bread_cereal', ['Pain aux céréales', 'Pão de cereais', 'Pan de cereales', 'Multigrain bread', 'Pane ai cereali'], 260, 10, 42, 5, 6, 50, 'carbs', [480, 220, 55, 2.2, 70, 1.5, 0, 0, 0]),
  food('sandwich_bread', ['Pain de mie', 'Pão de forma', 'Pan de molde', 'Sliced sandwich bread', 'Pancarré'], 265, 8, 48, 4, 2.8, 50, 'carbs', [480, 110, 90, 1.5, 25, 0.7, 0, 0, 0]),
  food('rusk', ['Biscotte', 'Tosta', 'Biscote', 'Rusk', 'Fetta biscottata'], 390, 12, 73, 5, 3.5, 20, 'carbs', [600, 180, 50, 2, 45, 1.2, 0, 0, 0]),
  food('tortilla', ['Tortilla / wrap', 'Tortilha / wrap', 'Tortilla / wrap', 'Tortilla wrap', 'Piadina / wrap'], 306, 8, 51, 7.5, 3, 60, 'carbs', [600, 130, 100, 2.5, 25, 0.7, 0, 0, 0]),
  food('corn', ['Maïs', 'Milho', 'Maíz', 'Sweetcorn', 'Mais'], 96, 3.4, 21, 1.5, 2.4, 100, 'carbs', [15, 270, 3, 0.5, 35, 0.6, 6, 0, 0]),
  food('farofa', ['Farofa', 'Farofa', 'Farofa', 'Farofa (toasted cassava flour)', 'Farofa'], 407, 2.5, 76, 10, 6.4, 30, 'carbs', [300, 80, 30, 1, 20, 0.5, 0, 0, 0]),
  food('tapioca', ['Galette de tapioca', 'Tapioca', 'Tapioca', 'Tapioca crepe', 'Crêpe di tapioca'], 240, 0.3, 59, 0.2, 0.5, 80, 'carbs', [1, 11, 20, 1.6, 1, 0.1, 0, 0, 0]),

  // ---------- Fruits ----------
  food('apple', ['Pomme', 'Maçã', 'Manzana', 'Apple', 'Mela'], 52, 0.3, 14, 0.2, 2.4, 150, 'fruit', [1, 107, 6, 0.1, 5, 0.04, 4.6, 0, 0]),
  food('banana', ['Banane', 'Banana', 'Plátano', 'Banana', 'Banana'], 89, 1.1, 23, 0.3, 2.6, 120, 'fruit', [1, 358, 5, 0.3, 27, 0.15, 8.7, 0, 0]),
  food('orange', ['Orange', 'Laranja', 'Naranja', 'Orange', 'Arancia'], 47, 0.9, 12, 0.1, 2.4, 150, 'fruit', [0, 181, 40, 0.1, 10, 0.07, 53, 0, 0]),
  food('strawberry', ['Fraises', 'Morangos', 'Fresas', 'Strawberries', 'Fragole'], 32, 0.7, 7.7, 0.3, 2, 150, 'fruit', [1, 153, 16, 0.4, 13, 0.14, 59, 0, 0]),
  food('blueberry', ['Myrtilles', 'Mirtilos', 'Arándanos', 'Blueberries', 'Mirtilli'], 57, 0.7, 14, 0.3, 2.4, 100, 'fruit', [1, 77, 6, 0.3, 6, 0.16, 9.7, 0, 0]),
  food('grapes', ['Raisin', 'Uvas', 'Uvas', 'Grapes', 'Uva'], 69, 0.7, 18, 0.2, 0.9, 100, 'fruit', [2, 191, 10, 0.4, 7, 0.07, 3.2, 0, 0]),
  food('mango', ['Mangue', 'Manga', 'Mango', 'Mango', 'Mango'], 60, 0.8, 15, 0.4, 1.6, 150, 'fruit', [1, 168, 11, 0.2, 10, 0.09, 36, 0, 0]),
  food('pineapple', ['Ananas', 'Ananás', 'Piña', 'Pineapple', 'Ananas'], 50, 0.5, 13, 0.1, 1.4, 150, 'fruit', [1, 109, 13, 0.3, 12, 0.12, 48, 0, 0]),
  food('kiwi', ['Kiwi', 'Kiwi', 'Kiwi', 'Kiwi', 'Kiwi'], 61, 1.1, 15, 0.5, 3, 75, 'fruit', [3, 312, 34, 0.3, 17, 0.14, 93, 0, 0]),
  food('watermelon', ['Pastèque', 'Melancia', 'Sandía', 'Watermelon', 'Anguria'], 30, 0.6, 7.6, 0.2, 0.4, 200, 'fruit', [1, 112, 7, 0.2, 10, 0.1, 8.1, 0, 0]),
  food('papaya', ['Papaye', 'Mamão', 'Papaya', 'Papaya', 'Papaya'], 43, 0.5, 11, 0.3, 1.7, 150, 'fruit', [8, 182, 20, 0.25, 21, 0.08, 61, 0, 0]),
  food('passion_fruit', ['Fruit de la passion', 'Maracujá', 'Maracuyá', 'Passion fruit', 'Frutto della passione'], 97, 2.2, 23, 0.7, 10.4, 60, 'fruit', [28, 348, 12, 1.6, 29, 0.1, 30, 0, 0]),
  food('acai', ['Açaí (pulpe)', 'Açaí (polpa)', 'Açaí (pulpa)', 'Açaí pulp', 'Açaí (polpa)'], 58, 0.8, 6.2, 3.9, 2.7, 200, 'fruit', [7, 105, 35, 0.6, 25, 0.2, 1, 0, 0]),
  food('guava', ['Goyave', 'Goiaba', 'Guayaba', 'Guava', 'Guava'], 68, 2.6, 14, 1, 5.4, 150, 'fruit', [2, 417, 18, 0.26, 22, 0.23, 228, 0, 0]),

  // ---------- Légumes ----------
  food('broccoli', ['Brocoli', 'Brócolos', 'Brócoli', 'Broccoli', 'Broccoli'], 34, 2.8, 7, 0.4, 2.6, 150, 'veg', [33, 316, 47, 0.7, 21, 0.4, 89, 0, 0]),
  food('carrot', ['Carotte', 'Cenoura', 'Zanahoria', 'Carrot', 'Carota'], 41, 0.9, 10, 0.2, 2.8, 100, 'veg', [69, 320, 33, 0.3, 12, 0.24, 5.9, 0, 0]),
  food('tomato', ['Tomate', 'Tomate', 'Tomate', 'Tomato', 'Pomodoro'], 18, 0.9, 3.9, 0.2, 1.2, 120, 'veg', [5, 237, 10, 0.3, 11, 0.17, 14, 0, 0]),
  food('zucchini', ['Courgette', 'Courgette', 'Calabacín', 'Courgette', 'Zucchina'], 17, 1.2, 3.1, 0.3, 1, 150, 'veg', [8, 261, 16, 0.4, 18, 0.32, 18, 0, 0]),
  food('spinach', ['Épinards', 'Espinafres', 'Espinacas', 'Spinach', 'Spinaci'], 23, 2.9, 3.6, 0.4, 2.2, 100, 'veg', [79, 558, 99, 2.7, 79, 0.53, 28, 0, 0]),
  food('lettuce', ['Salade verte', 'Alface', 'Lechuga', 'Lettuce', 'Lattuga'], 15, 1.4, 2.9, 0.2, 1.3, 60, 'veg', [28, 194, 36, 0.9, 13, 0.18, 9.2, 0, 0]),
  food('cucumber', ['Concombre', 'Pepino', 'Pepino', 'Cucumber', 'Cetriolo'], 15, 0.7, 3.6, 0.1, 0.5, 100, 'veg', [2, 147, 16, 0.3, 13, 0.2, 2.8, 0, 0]),
  food('pepper', ['Poivron', 'Pimento', 'Pimiento', 'Bell pepper', 'Peperone'], 26, 1, 6, 0.3, 2.1, 100, 'veg', [4, 211, 7, 0.4, 12, 0.13, 128, 0, 0]),
  food('onion', ['Oignon', 'Cebola', 'Cebolla', 'Onion', 'Cipolla'], 40, 1.1, 9.3, 0.1, 1.7, 60, 'veg', [4, 146, 23, 0.2, 10, 0.17, 7.4, 0, 0]),
  food('green_beans', ['Haricots verts', 'Feijão verde', 'Judías verdes', 'Green beans', 'Fagiolini'], 31, 1.8, 7, 0.1, 3.4, 150, 'veg', [6, 211, 37, 1, 25, 0.24, 12, 0, 0]),
  food('mushroom', ['Champignons', 'Cogumelos', 'Champiñones', 'Mushrooms', 'Funghi'], 22, 3.1, 3.3, 0.3, 1, 100, 'veg', [5, 318, 3, 0.5, 9, 0.52, 2.1, 0.2, 0]),
  food('cauliflower', ['Chou-fleur', 'Couve-flor', 'Coliflor', 'Cauliflower', 'Cavolfiore'], 25, 1.9, 5, 0.3, 2, 150, 'veg', [30, 299, 22, 0.4, 15, 0.27, 48, 0, 0]),
  food('cabbage_kale', ['Chou kale', 'Couve', 'Col rizada', 'Kale', 'Cavolo nero'], 49, 4.3, 9, 0.9, 3, 100, 'veg', [38, 447, 150, 1.5, 47, 0.56, 120, 0, 0]),
  food('eggplant', ['Aubergine', 'Beringela', 'Berenjena', 'Aubergine', 'Melanzana'], 25, 1, 6, 0.2, 3, 150, 'veg', [2, 229, 9, 0.2, 14, 0.16, 2.2, 0, 0]),

  // ---------- Matières grasses ----------
  food('olive_oil', ["Huile d'olive", 'Azeite', 'Aceite de oliva', 'Olive oil', "Olio d'oliva"], 884, 0, 0, 100, 0, 10, 'fat', [2, 1, 1, 0.56, 0, 0, 0, 0, 0]),
  food('butter', ['Beurre', 'Manteiga', 'Mantequilla', 'Butter', 'Burro'], 745, 0.9, 0.6, 82, 0, 10, 'fat', [11, 24, 24, 0.02, 2, 0.09, 0, 1.5, 0.2]),
  food('cream', ['Crème fraîche 30 %', 'Natas 30 %', 'Nata 30 %', 'Cream 30%', 'Panna 30%'], 292, 2.4, 3, 30, 0, 30, 'fat', [40, 90, 65, 0.05, 8, 0.3, 0.6, 0.6, 0.2]),
  food('avocado', ['Avocat', 'Abacate', 'Aguacate', 'Avocado', 'Avocado'], 160, 2, 8.5, 15, 6.7, 100, 'fat', [7, 485, 12, 0.6, 29, 0.64, 10, 0, 0]),
  food('almonds', ['Amandes', 'Amêndoas', 'Almendras', 'Almonds', 'Mandorle'], 579, 21, 22, 50, 12.5, 30, 'fat', [1, 733, 269, 3.7, 270, 3.1, 0, 0, 0]),
  food('walnuts', ['Noix', 'Nozes', 'Nueces', 'Walnuts', 'Noci'], 654, 15, 14, 65, 6.7, 30, 'fat', [2, 441, 98, 2.9, 158, 3.1, 1.3, 0, 0]),
  food('cashews', ['Noix de cajou', 'Castanha de caju', 'Anacardos', 'Cashews', 'Anacardi'], 553, 18, 30, 44, 3.3, 30, 'fat', [12, 660, 37, 6.7, 292, 5.8, 0.5, 0, 0]),
  food('brazil_nuts', ['Noix du Brésil', 'Castanha-do-pará', 'Nuez de Brasil', 'Brazil nuts', 'Noci del Brasile'], 659, 14, 12, 67, 7.5, 20, 'fat', [3, 659, 160, 2.4, 376, 4.1, 0.7, 0, 0]),
  food('peanut_butter', ['Beurre de cacahuète', 'Manteiga de amendoim', 'Crema de cacahuete', 'Peanut butter', 'Burro di arachidi'], 588, 25, 20, 50, 6, 20, 'fat', [400, 649, 43, 1.9, 168, 2.5, 0, 0, 0]),
  food('chia', ['Graines de chia', 'Sementes de chia', 'Semillas de chía', 'Chia seeds', 'Semi di chia'], 486, 17, 42, 31, 34, 15, 'fat', [16, 407, 631, 7.7, 335, 4.6, 1.6, 0, 0]),

  // ---------- Boissons ----------
  food('coffee', ['Café noir', 'Café preto', 'Café solo', 'Black coffee', 'Caffè nero'], 2, 0.1, 0, 0, 0, 200, 'drink', [2, 49, 2, 0.01, 3, 0.02, 0, 0, 0]),
  food('cappuccino', ['Cappuccino', 'Cappuccino', 'Capuchino', 'Cappuccino', 'Cappuccino'], 55, 3, 5.5, 2.2, 0, 150, 'drink'),
  food('hot_chocolate', ['Chocolat chaud', 'Chocolate quente', 'Chocolate caliente', 'Hot chocolate', 'Cioccolata calda'], 80, 3.4, 11, 2.5, 0.8, 200, 'drink'),
  food('tea', ['Thé', 'Chá', 'Té', 'Tea', 'Tè'], 1, 0, 0.2, 0, 0, 200, 'drink', [3, 37, 0, 0.02, 3, 0.02, 0, 0, 0]),
  food('orange_juice', ["Jus d'orange", 'Sumo de laranja', 'Zumo de naranja', 'Orange juice', "Succo d'arancia"], 45, 0.7, 10, 0.2, 0.2, 200, 'drink', [1, 200, 11, 0.2, 11, 0.05, 50, 0, 0]),
  food('apple_juice', ['Jus de pomme', 'Sumo de maçã', 'Zumo de manzana', 'Apple juice', 'Succo di mela'], 46, 0.1, 11, 0.1, 0.1, 200, 'drink', [4, 101, 8, 0.1, 5, 0.02, 1, 0, 0]),
  food('smoothie', ['Smoothie aux fruits', 'Batido de fruta', 'Smoothie de frutas', 'Fruit smoothie', 'Frullato di frutta'], 60, 0.7, 14, 0.2, 1.5, 250, 'drink'),
  food('cola', ['Soda au cola', 'Refrigerante de cola', 'Refresco de cola', 'Cola soft drink', 'Bibita alla cola'], 42, 0, 10.6, 0, 0, 330, 'drink'),
  food('cola_zero', ['Cola zéro', 'Cola zero', 'Cola zero', 'Diet cola', 'Cola zero'], 0.3, 0, 0, 0, 0, 330, 'drink'),
  food('guarana', ['Guaraná (soda)', 'Guaraná', 'Guaraná', 'Guaraná soft drink', 'Guaraná'], 40, 0, 10, 0, 0, 350, 'drink'),
  food('beer', ['Bière', 'Cerveja', 'Cerveza', 'Beer', 'Birra'], 43, 0.5, 3.6, 0, 0, 250, 'drink'),
  food('red_wine', ['Vin rouge', 'Vinho tinto', 'Vino tinto', 'Red wine', 'Vino rosso'], 85, 0.1, 2.6, 0, 0, 150, 'drink'),
  food('almond_milk', ["Lait d'amande", 'Bebida de amêndoa', 'Bebida de almendra', 'Almond milk', 'Bevanda di mandorla'], 24, 0.6, 3, 1.1, 0.3, 200, 'drink', [60, 60, 120, 0.3, 15, 0.15, 0, 0.75, 0.4]),

  // ---------- Petit-déjeuner et boulangerie ----------
  food('croissant', ['Croissant', 'Croissant', 'Cruasán', 'Croissant', 'Cornetto'], 406, 8, 46, 21, 2.6, 60, 'snack'),
  food('pain_chocolat', ['Pain au chocolat', 'Pão de chocolate', 'Napolitana de chocolate', 'Chocolate pastry', 'Pain au chocolat'], 414, 7, 44, 23, 2.5, 70, 'snack'),
  food('brioche', ['Brioche', 'Brioche', 'Brioche', 'Brioche', 'Brioche'], 350, 8, 50, 13, 1.8, 50, 'snack'),
  food('pastel_nata', ['Pastel de nata', 'Pastel de nata', 'Pastel de nata', 'Portuguese custard tart', 'Pastel de nata'], 298, 5, 37, 14, 1, 50, 'snack'),
  food('pao_de_queijo', ['Pão de queijo', 'Pão de queijo', 'Pan de queso', 'Brazilian cheese bread', 'Pane al formaggio'], 335, 6, 38, 17, 0.8, 40, 'snack'),
  food('cornflakes', ['Céréales type corn flakes', 'Cereais tipo corn flakes', 'Cereales tipo corn flakes', 'Corn flakes', 'Corn flakes'], 378, 7, 84, 0.9, 3, 40, 'carbs'),
  food('muesli', ['Muesli', 'Muesli', 'Muesli', 'Muesli', 'Muesli'], 360, 10, 60, 8, 7, 50, 'carbs'),
  food('granola', ['Granola', 'Granola', 'Granola', 'Granola', 'Granola'], 450, 9, 60, 18, 6, 50, 'carbs'),
  food('crepe', ['Crêpe', 'Crepe', 'Crepe', 'Pancake (crêpe)', 'Crêpe'], 190, 6, 25, 7, 1, 60, 'snack'),
  food('pancake', ['Pancake', 'Panqueca', 'Tortita', 'Pancake', 'Pancake'], 227, 6, 28, 10, 1, 60, 'snack'),
  food('waffle', ['Gaufre', 'Waffle', 'Gofre', 'Waffle', 'Waffle'], 291, 6.5, 33, 14, 1.2, 60, 'snack'),
  food('jam', ['Confiture', 'Doce de fruta', 'Mermelada', 'Jam', 'Marmellata'], 250, 0.4, 62, 0.1, 1, 20, 'snack'),
  food('honey', ['Miel', 'Mel', 'Miel', 'Honey', 'Miele'], 304, 0.3, 82, 0, 0.2, 20, 'snack', [4, 52, 6, 0.4, 2, 0.2, 0.5, 0, 0]),
  food('choco_spread', ['Pâte à tartiner chocolat', 'Creme de avelã', 'Crema de cacao', 'Chocolate hazelnut spread', 'Crema alla nocciola'], 539, 6, 57, 31, 3.4, 20, 'snack'),
  food('doce_de_leite', ['Confiture de lait', 'Doce de leite', 'Dulce de leche', 'Dulce de leche', 'Dulce de leche'], 315, 6, 55, 7, 0, 20, 'snack'),
  food('goiabada', ['Pâte de goyave', 'Goiabada', 'Dulce de guayaba', 'Guava paste', 'Goiabada'], 296, 0.4, 74, 0.1, 3, 40, 'snack'),

  // ---------- En-cas ----------
  food('dark_chocolate', ['Chocolat noir', 'Chocolate preto', 'Chocolate negro', 'Dark chocolate', 'Cioccolato fondente'], 546, 5, 61, 31, 7, 25, 'snack', [20, 715, 73, 11.9, 228, 3.3, 0, 0, 0]),
  food('milk_chocolate', ['Chocolat au lait', 'Chocolate de leite', 'Chocolate con leche', 'Milk chocolate', 'Cioccolato al latte'], 535, 7.6, 59, 30, 3.4, 25, 'snack', [79, 372, 189, 2.4, 63, 2.3, 0, 0.5, 0.75]),
  food('brigadeiro', ['Brigadeiro', 'Brigadeiro', 'Brigadeiro', 'Brigadeiro', 'Brigadeiro'], 380, 4, 60, 14, 1.5, 20, 'snack'),
  food('cookies', ['Biscuits', 'Bolachas', 'Galletas', 'Biscuits', 'Biscotti'], 480, 6, 65, 21, 2.5, 30, 'snack'),
  food('chips', ['Chips', 'Batatas fritas de pacote', 'Patatas fritas de bolsa', 'Crisps', 'Patatine'], 536, 7, 53, 34, 4.4, 30, 'snack'),
  food('ice_cream', ['Glace', 'Gelado', 'Helado', 'Ice cream', 'Gelato'], 207, 3.5, 24, 11, 0.7, 100, 'snack'),

  // ---------- Plats ----------
  food('pizza', ['Pizza margherita', 'Pizza margherita', 'Pizza margarita', 'Margherita pizza', 'Pizza margherita'], 266, 11, 33, 10, 2.3, 300, 'dish'),
  food('burger', ['Burger', 'Hambúrguer', 'Hamburguesa', 'Burger', 'Hamburger'], 295, 17, 24, 14, 1.5, 220, 'dish'),
  food('fries', ['Frites', 'Batatas fritas', 'Patatas fritas', 'French fries', 'Patatine fritte'], 312, 3.4, 41, 15, 3.8, 150, 'dish'),
  food('sushi', ['Sushi', 'Sushi', 'Sushi', 'Sushi', 'Sushi'], 145, 6, 26, 1.5, 1.5, 200, 'dish'),
  food('sandwich_ham', ['Sandwich jambon-beurre', 'Sandes de fiambre', 'Bocadillo de jamón', 'Ham sandwich', 'Panino al prosciutto'], 260, 11, 33, 9, 2, 200, 'dish'),
  food('bolognese', ['Pâtes bolognaise', 'Massa à bolonhesa', 'Pasta boloñesa', 'Spaghetti bolognese', 'Pasta al ragù'], 145, 7, 18, 4.5, 1.8, 350, 'dish'),
  food('caesar_salad', ['Salade César', 'Salada César', 'Ensalada César', 'Caesar salad', 'Insalata Caesar'], 190, 10, 6, 14, 1.2, 250, 'dish'),
  food('arroz_feijao', ['Riz-haricots (arroz e feijão)', 'Arroz e feijão', 'Arroz con frijoles', 'Rice and beans', 'Riso e fagioli'], 110, 4, 20, 1.5, 3, 300, 'dish'),
  food('feijoada', ['Feijoada', 'Feijoada', 'Feijoada', 'Feijoada', 'Feijoada'], 180, 12, 12, 9, 4, 300, 'dish'),
  food('moqueca', ['Moqueca de poisson', 'Moqueca de peixe', 'Moqueca de pescado', 'Fish moqueca', 'Moqueca di pesce'], 120, 11, 4, 7, 1, 300, 'dish'),
  food('coxinha', ['Coxinha', 'Coxinha', 'Coxinha', 'Coxinha', 'Coxinha'], 280, 9, 30, 13, 1.5, 80, 'dish'),
  food('pastel', ['Pastel frit', 'Pastel', 'Pastel frito', 'Fried pastel', 'Pastel fritto'], 340, 8, 33, 19, 1.5, 80, 'dish'),
  food('bolinho_bacalhau', ['Beignet de morue', 'Bolinho de bacalhau', 'Buñuelo de bacalao', 'Salt cod fritter', 'Frittella di baccalà'], 260, 11, 22, 14, 1.2, 60, 'dish'),
  food('caldo_verde', ['Caldo verde', 'Caldo verde', 'Caldo verde', 'Caldo verde soup', 'Caldo verde'], 65, 2.5, 8, 2.5, 1.5, 250, 'dish'),

  // ---------- Sport et compléments ----------
  food('whey', ['Whey (poudre)', 'Whey (pó)', 'Whey (polvo)', 'Whey protein powder', 'Whey (polvere)'], 400, 80, 8, 6, 0, 30, 'supplement'),
  food('casein', ['Caséine (poudre)', 'Caseína (pó)', 'Caseína (polvo)', 'Casein powder', 'Caseina (polvere)'], 370, 78, 6, 3, 0, 30, 'supplement'),
  food('gainer', ['Gainer (poudre)', 'Gainer (pó)', 'Gainer (polvo)', 'Mass gainer powder', 'Gainer (polvere)'], 380, 20, 65, 4, 1, 100, 'supplement'),
  food('protein_drink', ['Boisson protéinée prête', 'Bebida proteica pronta', 'Bebida proteica lista', 'Ready-to-drink protein shake', 'Bevanda proteica pronta'], 55, 10, 2, 0.5, 0, 330, 'supplement'),
  food('protein_bar', ['Barre protéinée', 'Barra proteica', 'Barrita proteica', 'Protein bar', 'Barretta proteica'], 350, 30, 35, 9, 3, 60, 'supplement'),
  food('energy_bar', ['Barre énergétique', 'Barra energética', 'Barrita energética', 'Energy bar', 'Barretta energetica'], 380, 6, 60, 12, 3, 50, 'supplement'),
  food('energy_gel', ['Gel énergétique', 'Gel energético', 'Gel energético', 'Energy gel', 'Gel energetico'], 250, 0, 62, 0, 0, 40, 'supplement'),
  food('isotonic', ['Boisson isotonique', 'Bebida isotónica', 'Bebida isotónica', 'Isotonic sports drink', 'Bevanda isotonica'], 24, 0, 6, 0, 0, 500, 'supplement'),
  food('maltodextrin', ['Maltodextrine', 'Maltodextrina', 'Maltodextrina', 'Maltodextrin', 'Maltodestrine'], 380, 0, 95, 0, 0, 30, 'supplement'),
  food('bcaa', ['BCAA (poudre)', 'BCAA (pó)', 'BCAA (polvo)', 'BCAA powder', 'BCAA (polvere)'], 400, 98, 0, 0, 0, 10, 'supplement'),
  food('creatine', ['Créatine', 'Creatina', 'Creatina', 'Creatine monohydrate', 'Creatina'], 0, 0, 0, 0, 0, 5, 'supplement'),
]

/**
 * Mesures ménagères, par identifiant d'aliment. Un premier utilisateur a
 * renoncé à saisir « deux cuillères de skyr » faute de trouver autre chose que
 * des grammes : peser est l'exception, pas la règle.
 */
const PORTIONS: Record<string, PortionUnit[]> = {
  // Fruits et œufs, comptés à l'unité
  banana: [{ key: 'unit', grams: 120 }],
  apple: [{ key: 'unit', grams: 150 }],
  orange: [{ key: 'unit', grams: 150 }],
  kiwi: [{ key: 'unit', grams: 75 }],
  mango: [{ key: 'unit', grams: 200 }],
  guava: [{ key: 'unit', grams: 100 }],
  passion_fruit: [{ key: 'unit', grams: 60 }],
  papaya: [{ key: 'slice', grams: 150 }],
  egg: [{ key: 'unit', grams: 55 }],
  egg_white: [{ key: 'unit', grams: 33 }],

  // Laitages : cuillère et pot
  skyr: [{ key: 'spoon', grams: 20 }, { key: 'pot', grams: 150 }],
  yogurt_plain: [{ key: 'pot', grams: 125 }, { key: 'spoon', grams: 20 }],
  greek_yogurt: [{ key: 'pot', grams: 150 }, { key: 'spoon', grams: 20 }],
  cottage: [{ key: 'spoon', grams: 30 }],
  requeijao: [{ key: 'spoon', grams: 20 }],
  milk_semi: [{ key: 'glass', grams: 200 }],

  // Fromages
  emmental: [{ key: 'slice', grams: 25 }],
  comte: [{ key: 'slice', grams: 25 }],
  cheddar: [{ key: 'slice', grams: 25 }],
  mozzarella: [{ key: 'unit', grams: 125 }],
  parmesan: [{ key: 'spoon', grams: 10 }],
  processed_cheese: [{ key: 'unit', grams: 20 }],
  cream_cheese: [{ key: 'spoon', grams: 20 }],

  // Pains et céréales
  bread_whole: [{ key: 'slice', grams: 30 }],
  baguette: [{ key: 'slice', grams: 30 }],
  bread_cereal: [{ key: 'slice', grams: 30 }],
  sandwich_bread: [{ key: 'slice', grams: 25 }],
  pao_frances: [{ key: 'unit', grams: 50 }],
  rusk: [{ key: 'unit', grams: 8 }],
  tortilla: [{ key: 'unit', grams: 60 }],
  oats: [{ key: 'spoon', grams: 15 }],
  cornflakes: [{ key: 'glass', grams: 30 }],
  muesli: [{ key: 'spoon', grams: 20 }],
  granola: [{ key: 'spoon', grams: 20 }],

  // Charcuterie et poisson tranchés
  ham: [{ key: 'slice', grams: 40 }],
  cured_ham: [{ key: 'slice', grams: 15 }],
  bacon: [{ key: 'slice', grams: 15 }],
  smoked_salmon: [{ key: 'slice', grams: 25 }],
  sausage: [{ key: 'unit', grams: 60 }],
  merguez: [{ key: 'unit', grams: 60 }],

  // Matières grasses et oléagineux
  olive_oil: [{ key: 'spoon', grams: 10 }, { key: 'teaspoon', grams: 5 }],
  butter: [{ key: 'teaspoon', grams: 5 }, { key: 'spoon', grams: 15 }],
  cream: [{ key: 'spoon', grams: 15 }],
  peanut_butter: [{ key: 'spoon', grams: 20 }],
  chia: [{ key: 'spoon', grams: 12 }],
  almonds: [{ key: 'handful', grams: 25 }],
  walnuts: [{ key: 'handful', grams: 25 }],
  cashews: [{ key: 'handful', grams: 25 }],
  brazil_nuts: [{ key: 'unit', grams: 5 }],
  avocado: [{ key: 'unit', grams: 150 }],

  // Boissons
  coffee: [{ key: 'glass', grams: 100 }],
  tea: [{ key: 'glass', grams: 200 }],
  cappuccino: [{ key: 'glass', grams: 150 }],
  hot_chocolate: [{ key: 'glass', grams: 200 }],
  orange_juice: [{ key: 'glass', grams: 200 }],
  apple_juice: [{ key: 'glass', grams: 200 }],
  smoothie: [{ key: 'glass', grams: 250 }],
  almond_milk: [{ key: 'glass', grams: 200 }],
  cola: [{ key: 'glass', grams: 250 }],
  cola_zero: [{ key: 'glass', grams: 250 }],
  guarana: [{ key: 'glass', grams: 250 }],
  beer: [{ key: 'glass', grams: 250 }],
  red_wine: [{ key: 'glass', grams: 125 }],

  // Sucré et en-cas
  honey: [{ key: 'teaspoon', grams: 7 }, { key: 'spoon', grams: 20 }],
  jam: [{ key: 'spoon', grams: 20 }],
  choco_spread: [{ key: 'spoon', grams: 20 }],
  doce_de_leite: [{ key: 'spoon', grams: 20 }],
  cookies: [{ key: 'unit', grams: 8 }],
  dark_chocolate: [{ key: 'unit', grams: 5 }],
  milk_chocolate: [{ key: 'unit', grams: 5 }],
  croissant: [{ key: 'unit', grams: 60 }],
  pain_chocolat: [{ key: 'unit', grams: 70 }],
  brioche: [{ key: 'slice', grams: 40 }],
  pastel_nata: [{ key: 'unit', grams: 50 }],
  pao_de_queijo: [{ key: 'unit', grams: 40 }],
  brigadeiro: [{ key: 'unit', grams: 20 }],
  crepe: [{ key: 'unit', grams: 60 }],
  pancake: [{ key: 'unit', grams: 60 }],
  waffle: [{ key: 'unit', grams: 60 }],
  ice_cream: [{ key: 'pot', grams: 100 }],

  // Compléments : la dosette est la mesure de référence
  whey: [{ key: 'dose', grams: 30 }],
  casein: [{ key: 'dose', grams: 30 }],
  gainer: [{ key: 'dose', grams: 50 }],
  maltodextrin: [{ key: 'dose', grams: 15 }],
  bcaa: [{ key: 'dose', grams: 10 }],
  creatine: [{ key: 'teaspoon', grams: 5 }],
  protein_bar: [{ key: 'unit', grams: 60 }],
  energy_bar: [{ key: 'unit', grams: 50 }],
  energy_gel: [{ key: 'unit', grams: 40 }],

  // Légumes comptés à l'unité
  tomato: [{ key: 'unit', grams: 120 }],
  carrot: [{ key: 'unit', grams: 100 }],
  onion: [{ key: 'unit', grams: 60 }],
  potato: [{ key: 'unit', grams: 150 }],
}

/**
 * Termes alternatifs pour la recherche. Le portugais du Brésil et celui du
 * Portugal divergent beaucoup sur les aliments — « biscoito » contre
 * « bolacha », « suco » contre « sumo », « abobrinha » contre « courgette » —
 * et un utilisateur qui ne trouve pas son aliment abandonne la saisie.
 */
const ALIASES: Record<string, string[]> = {
  cookies: ['biscoito', 'biscoitos', 'bolacha', 'bolachas', 'cream cracker', 'petit-beurre'],
  orange_juice: ['suco de laranja', 'jugo de naranja'],
  apple_juice: ['suco de maca', 'jugo de manzana'],
  tea: ['infusion', 'infusao', 'tisane', 'cha de ervas', 'cha de frutas', 'cha verde', 'cha preto'],
  ham: ['presunto cozido', 'presunto', 'jambon cuit'],
  cured_ham: ['presunto cru', 'jamon serrano', 'parma'],
  bacon: ['toucinho', 'lardon', 'panceta'],
  pao_frances: ['paozinho', 'pao de sal', 'cacetinho'],
  sandwich_bread: ['pao de forma', 'pao de sanduiche', 'pain de mie'],
  cornflakes: ['sucrilhos', 'cereais matinais', 'cereales'],
  peanut_butter: ['pasta de amendoim'],
  cream_cheese: ['philadelphia', 'queijo creme', 'saint moret'],
  skyr: ['quark', 'fromage blanc', 'queijo fresco batido', 'yaourt grec maigre'],
  milk_semi: ['leite', 'lait'],
  tuna_can: ['atum em lata', 'atum enlatado', 'thon en boite'],
  chips: ['batata chips', 'salgadinho', 'patatas'],
  fries: ['batata frita', 'patatas fritas'],
  zucchini: ['abobrinha'],
  green_beans: ['vagem'],
  cabbage_kale: ['couve', 'couve manteiga'],
  sweet_potato: ['batata doce'],
  cassava: ['aipim', 'macaxeira', 'mandioca', 'manioc'],
  corn: ['milho verde', 'mais doux'],
  watermelon: ['melancia'],
  pineapple: ['abacaxi'],
  papaya: ['mamao', 'papaia'],
  passion_fruit: ['maracuja'],
  guava: ['goiaba'],
  oats: ['aveia', 'porridge', 'flocons'],
  rice_white: ['arroz'],
  black_beans: ['feijao preto', 'feijao'],
  kidney_beans: ['feijao vermelho'],
  feijao_carioca: ['feijao carioca', 'feijao cozido'],
  dark_chocolate: ['chocolate amargo', 'chocolate 70'],
  whey: ['proteina em po', 'dose de whey', 'proteine en poudre'],
  olive_oil: ['azeite de oliva'],
  egg: ['ovo cozido', 'ovo frito', 'oeuf dur', 'omelette'],
  chicken_breast: ['file de frango', 'filet de poulet'],
  beef_mince: ['carne moida', 'viande hachee'],
  yogurt_plain: ['iogurte', 'yaourt'],
  strawberry: ['morango'],
  grapes: ['uva'],
}

// Les mesures et synonymes sont rattachés après coup : la table reste lisible.
for (const item of BUILTIN_FOODS) {
  if (PORTIONS[item.id]) item.portions = PORTIONS[item.id]
  if (ALIASES[item.id]) item.aliases = ALIASES[item.id]
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  'protein',
  'carbs',
  'dairy',
  'fruit',
  'veg',
  'fat',
  'drink',
  'snack',
  'dish',
  'supplement',
]

export function foodName(food: Food, lang: Lang): string {
  return food.i18n?.[lang] ?? food.name
}

/** États proposés par un aliment, toujours dans l'ordre cru puis cuit. Vide s'il n'en a qu'un. */
export function statesOf(food: Food): FoodState[] {
  return food.alt && food.state ? ['raw', 'cooked'] : []
}

/** Retire accents et casse pour que « pates » retrouve « Pâtes ». */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Recherche sur tous les libellés traduits : un utilisateur en français
 * retrouve aussi un aliment en tapant son nom anglais.
 */
export function searchFoods(foods: Food[], query: string, lang: Lang): Food[] {
  const q = normalize(query)
  // Sans recherche, la liste sert à parcourir : l'ordre du fichier source
  // reléguait fruits, légumes et boissons hors de portée.
  if (!q) return [...foods].sort((a, b) => foodName(a, lang).localeCompare(foodName(b, lang)))
  const scored = foods
    .map((item) => {
      const labelList = [
        item.name,
        ...Object.values(item.i18n ?? {}),
        ...(item.aliases ?? []),
      ].map(normalize)
      const best = labelList.reduce((acc, label) => {
        if (label.startsWith(q)) return Math.max(acc, 2)
        if (label.includes(q)) return Math.max(acc, 1)
        return acc
      }, 0)
      return { item, score: best }
    })
    .filter((entry) => entry.score > 0)

  scored.sort((a, b) => b.score - a.score || foodName(a.item, lang).localeCompare(foodName(b.item, lang)))
  return scored.map((entry) => entry.item)
}
