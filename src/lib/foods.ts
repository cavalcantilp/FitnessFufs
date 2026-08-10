import type { Food, FoodCategory, FoodState, Lang } from './types'

/** Libellés dans l'ordre : fr, pt, es, en, it. */
type Names = [string, string, string, string, string]

/** Valeurs d'un état de préparation : kcal, protéines, glucides, lipides, portion usuelle. */
type Vals = [number, number, number, number, number]

const LANG_ORDER: Lang[] = ['fr', 'pt', 'es', 'en', 'it']

function labels(names: Names): Partial<Record<Lang, string>> {
  const i18n: Partial<Record<Lang, string>> = {}
  LANG_ORDER.forEach((lang, index) => {
    i18n[lang] = names[index]
  })
  return i18n
}

/** Aliment à état unique : ce qu'on pèse est ce qu'on mange. */
function food(
  id: string,
  names: Names,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  serving: number,
  category: FoodCategory,
): Food {
  return {
    id,
    name: names[0],
    i18n: labels(names),
    per100: { kcal, protein, carbs, fat },
    serving,
    category,
  }
}

/**
 * Aliment pesable cru ou cuit. La cuisson change le poids sans changer la
 * matière : 100 g de riz cru donnent ~280 g de riz cuit, 100 g de poulet cru
 * ~70 g de poulet cuit. Les valeurs pour 100 g diffèrent donc du tout au tout.
 *
 * `defaultState` reflète l'usage courant : on pèse les féculents et légumineuses
 * dans l'assiette, les viandes et poissons au moment de les acheter ou de les
 * cuisiner.
 */
function food2(
  id: string,
  names: Names,
  category: FoodCategory,
  defaultState: FoodState,
  raw: Vals,
  cooked: Vals,
): Food {
  const asPortion = ([kcal, protein, carbs, fat, serving]: Vals) => ({
    per100: { kcal, protein, carbs, fat },
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
  }
}

/**
 * Base d'aliments intégrée. Valeurs pour 100 g (ou 100 ml pour les boissons),
 * arrondies à partir des tables de composition usuelles (Ciqual, USDA, TACO).
 */
export const BUILTIN_FOODS: Food[] = [
  // ---------- Viandes ----------
  food2('chicken_breast', ['Blanc de poulet', 'Peito de frango', 'Pechuga de pollo', 'Chicken breast', 'Petto di pollo'], 'protein', 'raw', [120, 22.5, 0, 2.6, 150], [165, 31, 0, 3.6, 120]),
  food2('chicken_thigh', ['Cuisse de poulet', 'Coxa de frango', 'Muslo de pollo', 'Chicken thigh', 'Coscia di pollo'], 'protein', 'raw', [150, 18, 0, 8.5, 160], [209, 26, 0, 11, 130]),
  food('chicken_roast', ['Poulet rôti (avec peau)', 'Frango assado (com pele)', 'Pollo asado (con piel)', 'Roast chicken with skin', 'Pollo arrosto con pelle'], 220, 27, 0, 12, 150, 'protein'),
  food2('turkey', ['Escalope de dinde', 'Peito de peru', 'Pechuga de pavo', 'Turkey breast', 'Fesa di tacchino'], 'protein', 'raw', [104, 22, 0, 1.2, 150], [135, 29, 0, 1.5, 120]),
  food2('beef_mince', ['Bœuf haché 5 %', 'Carne moída 5 %', 'Carne picada 5 %', 'Lean beef mince 5%', 'Macinato di manzo 5%'], 'protein', 'raw', [137, 21, 0, 5, 150], [190, 28, 0, 8, 120]),
  food2('steak', ['Steak de bœuf', 'Bife de vaca', 'Filete de ternera', 'Beef steak', 'Bistecca di manzo'], 'protein', 'raw', [155, 22, 0, 7.5, 180], [217, 26, 0, 12, 150]),
  food2('picanha', ['Picanha', 'Picanha', 'Picaña', 'Picanha (rump cap)', 'Picanha'], 'protein', 'raw', [190, 21, 0, 12, 180], [250, 27, 0, 16, 150]),
  food2('pork_loin', ['Filet de porc', 'Lombo de porco', 'Lomo de cerdo', 'Pork loin', 'Lombo di maiale'], 'protein', 'raw', [120, 21, 0, 3.5, 150], [165, 28, 0, 5.5, 120]),
  food2('lamb', ["Côtelette d'agneau", 'Costeleta de borrego', 'Chuleta de cordero', 'Lamb chop', 'Costoletta di agnello'], 'protein', 'raw', [230, 17, 0, 18, 180], [294, 25, 0, 21, 150]),
  food2('duck', ['Magret de canard', 'Peito de pato', 'Magret de pato', 'Duck breast', 'Petto di anatra'], 'protein', 'raw', [200, 18, 0, 14, 180], [240, 24, 0, 16, 150]),
  food2('veal', ['Escalope de veau', 'Escalope de vitela', 'Escalope de ternera', 'Veal escalope', 'Scaloppina di vitello'], 'protein', 'raw', [110, 21, 0, 2.5, 150], [150, 29, 0, 3.5, 130]),
  food2('liver', ['Foie de volaille', 'Fígado de frango', 'Hígado de pollo', 'Chicken liver', 'Fegato di pollo'], 'protein', 'raw', [116, 20, 3, 4, 120], [165, 26, 4, 6, 100]),
  food2('sausage', ['Saucisse / chipolata', 'Salsicha fresca', 'Salchicha fresca', 'Pork sausage', 'Salsiccia'], 'protein', 'raw', [280, 13, 2, 24, 120], [320, 16, 2, 28, 100]),
  food('merguez', ['Merguez', 'Merguez', 'Merguez', 'Merguez sausage', 'Merguez'], 300, 14, 1.5, 27, 100, 'protein'),
  food2('bacon', ['Bacon / lardons', 'Bacon', 'Bacon', 'Bacon', 'Pancetta'], 'protein', 'raw', [250, 15, 1, 21, 50], [330, 24, 1, 26, 30]),
  food('ham', ['Jambon blanc', 'Fiambre', 'Jamón cocido', 'Cooked ham', 'Prosciutto cotto'], 107, 18, 1, 3.5, 40, 'protein'),
  food('cured_ham', ['Jambon cru / Parme', 'Presunto', 'Jamón serrano', 'Cured ham', 'Prosciutto crudo'], 268, 30, 0.3, 16, 30, 'protein'),
  food('chorizo', ['Chorizo', 'Chouriço', 'Chorizo', 'Chorizo', 'Chorizo'], 455, 24, 2, 38, 30, 'protein'),
  food('rillettes', ['Rillettes', 'Rillettes', 'Rillettes', 'Rillettes', 'Rillettes'], 400, 15, 0, 38, 30, 'protein'),

  // ---------- Poissons et fruits de mer ----------
  food2('salmon', ['Saumon', 'Salmão', 'Salmón', 'Salmon', 'Salmone'], 'protein', 'raw', [180, 20, 0, 11, 150], [208, 22, 0, 13, 130]),
  food('smoked_salmon', ['Saumon fumé', 'Salmão fumado', 'Salmón ahumado', 'Smoked salmon', 'Salmone affumicato'], 180, 23, 0, 9, 50, 'protein'),
  food2('cod', ['Cabillaud', 'Bacalhau fresco', 'Bacalao fresco', 'Cod', 'Merluzzo'], 'protein', 'raw', [82, 18, 0, 0.7, 150], [105, 23, 0, 0.9, 130]),
  food('salt_cod', ['Morue dessalée', 'Bacalhau demolhado', 'Bacalao desalado', 'Salt cod, soaked', 'Baccalà ammollato'], 135, 29, 0, 1.5, 130, 'protein'),
  food2('tuna_fresh', ['Thon frais', 'Atum fresco', 'Atún fresco', 'Fresh tuna', 'Tonno fresco'], 'protein', 'raw', [144, 23, 0, 5, 150], [184, 30, 0, 6, 130]),
  food('tuna_can', ['Thon au naturel', 'Atum ao natural', 'Atún al natural', 'Canned tuna in water', 'Tonno al naturale'], 116, 26, 0, 1, 80, 'protein'),
  food2('sardine', ['Sardine fraîche', 'Sardinha fresca', 'Sardina fresca', 'Fresh sardine', 'Sardina fresca'], 'protein', 'raw', [165, 20, 0, 9, 120], [208, 25, 0, 11, 100]),
  food('sardine_can', ["Sardines à l'huile", 'Sardinhas em azeite', 'Sardinas en aceite', 'Sardines in oil', 'Sardine sott olio'], 208, 24, 0, 12, 60, 'protein'),
  food2('mackerel', ['Maquereau', 'Cavala', 'Caballa', 'Mackerel', 'Sgombro'], 'protein', 'raw', [190, 19, 0, 12, 150], [262, 24, 0, 18, 130]),
  food2('trout', ['Truite', 'Truta', 'Trucha', 'Trout', 'Trota'], 'protein', 'raw', [119, 20, 0, 3.5, 150], [148, 21, 0, 6.6, 130]),
  food2('sea_bream', ['Dorade', 'Dourada', 'Dorada', 'Sea bream', 'Orata'], 'protein', 'raw', [96, 20, 0, 1.5, 180], [125, 26, 0, 2, 150]),
  food2('sea_bass', ['Bar / loup', 'Robalo', 'Lubina', 'Sea bass', 'Branzino'], 'protein', 'raw', [97, 18, 0, 2, 180], [124, 23, 0, 2.6, 150]),
  food('herring', ['Hareng', 'Arenque', 'Arenque', 'Herring', 'Aringa'], 158, 18, 0, 9, 100, 'protein'),
  food2('shrimp', ['Crevettes', 'Camarão', 'Gambas', 'Shrimp', 'Gamberi'], 'protein', 'raw', [85, 20, 0.2, 0.5, 120], [99, 24, 0.2, 0.3, 100]),
  food('squid', ['Calamar grillé', 'Lulas grelhadas', 'Calamar a la plancha', 'Grilled squid', 'Calamari alla griglia'], 110, 19, 3, 1.8, 150, 'protein'),
  food('mussels', ['Moules cuites', 'Mexilhões cozidos', 'Mejillones cocidos', 'Cooked mussels', 'Cozze cotte'], 172, 24, 7, 4.5, 150, 'protein'),
  food('crab', ['Crabe', 'Caranguejo', 'Cangrejo', 'Crab', 'Granchio'], 84, 18, 0, 1, 100, 'protein'),

  // ---------- Œufs et végétal ----------
  food('egg', ['Œuf entier', 'Ovo inteiro', 'Huevo entero', 'Whole egg', 'Uovo intero'], 143, 13, 0.7, 9.5, 55, 'protein'),
  food('egg_white', ["Blanc d'œuf", 'Clara de ovo', 'Clara de huevo', 'Egg white', "Albume d'uovo"], 52, 11, 0.7, 0.2, 33, 'protein'),
  food('tofu', ['Tofu ferme', 'Tofu firme', 'Tofu firme', 'Firm tofu', 'Tofu compatto'], 144, 15, 3, 8, 100, 'protein'),
  food2('lentils', ['Lentilles', 'Lentilhas', 'Lentejas', 'Lentils', 'Lenticchie'], 'protein', 'cooked', [353, 25, 60, 1.1, 60], [116, 9, 20, 0.4, 150]),
  food2('chickpeas', ['Pois chiches', 'Grão-de-bico', 'Garbanzos', 'Chickpeas', 'Ceci'], 'protein', 'cooked', [364, 19, 61, 6, 60], [164, 8.9, 27, 2.6, 150]),
  food2('kidney_beans', ['Haricots rouges', 'Feijão vermelho', 'Alubias rojas', 'Kidney beans', 'Fagioli rossi'], 'protein', 'cooked', [333, 24, 60, 0.8, 60], [127, 8.7, 22.8, 0.5, 150]),
  food2('black_beans', ['Haricots noirs', 'Feijão preto', 'Frijoles negros', 'Black beans', 'Fagioli neri'], 'protein', 'cooked', [341, 21, 62, 1.4, 60], [132, 8.9, 24, 0.5, 150]),
  food('feijao_carioca', ['Feijão carioca cuit', 'Feijão carioca cozido', 'Frijol carioca cocido', 'Cooked carioca beans', 'Fagioli carioca cotti'], 76, 4.8, 13.6, 0.5, 150, 'protein'),

  // ---------- Produits laitiers ----------
  food('milk_semi', ['Lait demi-écrémé', 'Leite meio-gordo', 'Leche semidesnatada', 'Semi-skimmed milk', 'Latte parzialmente scremato'], 46, 3.4, 4.8, 1.6, 200, 'dairy'),
  food('yogurt_plain', ['Yaourt nature', 'Iogurte natural', 'Yogur natural', 'Plain yogurt', 'Yogurt bianco'], 61, 3.5, 4.7, 3.3, 125, 'dairy'),
  food('skyr', ['Skyr / fromage blanc 0 %', 'Skyr / queijo quark 0 %', 'Skyr / queso batido 0 %', 'Skyr / fat-free quark', 'Skyr / fiocchi magri'], 63, 11, 4, 0.2, 150, 'dairy'),
  food('greek_yogurt', ['Yaourt grec', 'Iogurte grego', 'Yogur griego', 'Greek yogurt', 'Yogurt greco'], 97, 9, 3.6, 5, 150, 'dairy'),
  food('cottage', ['Cottage cheese', 'Queijo cottage', 'Requesón', 'Cottage cheese', 'Fiocchi di latte'], 98, 11, 3.4, 4.3, 100, 'dairy'),
  food('requeijao', ['Requeijão', 'Requeijão', 'Requesón cremoso', 'Requeijão spread', 'Formaggio spalmabile'], 250, 8, 4, 23, 30, 'dairy'),

  // ---------- Fromages ----------
  food('emmental', ['Emmental', 'Queijo emmental', 'Queso emmental', 'Emmental', 'Emmental'], 380, 27, 1.5, 29, 30, 'dairy'),
  food('comte', ['Comté', 'Queijo comté', 'Queso comté', 'Comté', 'Comté'], 417, 28, 0.5, 34, 30, 'dairy'),
  food('beaufort', ['Beaufort', 'Queijo beaufort', 'Queso beaufort', 'Beaufort', 'Beaufort'], 401, 26, 1.5, 33, 30, 'dairy'),
  food('cantal', ['Cantal', 'Queijo cantal', 'Queso cantal', 'Cantal', 'Cantal'], 369, 24, 1.5, 30, 30, 'dairy'),
  food('tomme', ['Tomme de Savoie', 'Tomme de Savoie', 'Tomme de Savoie', 'Tomme de Savoie', 'Tomme de Savoie'], 300, 24, 0.5, 23, 30, 'dairy'),
  food('mimolette', ['Mimolette', 'Mimolette', 'Mimolette', 'Mimolette', 'Mimolette'], 366, 25, 0, 29, 30, 'dairy'),
  food('camembert', ['Camembert', 'Camembert', 'Camembert', 'Camembert', 'Camembert'], 299, 20, 0.5, 24, 30, 'dairy'),
  food('brie', ['Brie', 'Brie', 'Brie', 'Brie', 'Brie'], 334, 21, 0.5, 28, 30, 'dairy'),
  food('reblochon', ['Reblochon', 'Reblochon', 'Reblochon', 'Reblochon', 'Reblochon'], 330, 20, 1, 27, 30, 'dairy'),
  food('munster', ['Munster', 'Munster', 'Munster', 'Munster', 'Munster'], 330, 21, 1, 27, 30, 'dairy'),
  food('saint_nectaire', ['Saint-Nectaire', 'Saint-Nectaire', 'Saint-Nectaire', 'Saint-Nectaire', 'Saint-Nectaire'], 341, 22, 1.5, 28, 30, 'dairy'),
  food('raclette', ['Raclette', 'Queijo raclette', 'Queso raclette', 'Raclette', 'Raclette'], 357, 23, 1.5, 29, 40, 'dairy'),
  food('roquefort', ['Roquefort', 'Roquefort', 'Roquefort', 'Roquefort', 'Roquefort'], 369, 22, 2, 31, 30, 'dairy'),
  food('gorgonzola', ["Bleu / gorgonzola", 'Gorgonzola', 'Queso azul', 'Blue cheese', 'Gorgonzola'], 353, 21, 2.3, 29, 30, 'dairy'),
  food('goat_fresh', ['Chèvre frais', 'Queijo de cabra fresco', 'Queso de cabra fresco', 'Fresh goat cheese', 'Caprino fresco'], 268, 18, 3, 21, 30, 'dairy'),
  food('goat_aged', ['Chèvre affiné', 'Queijo de cabra curado', 'Queso de cabra curado', 'Aged goat cheese', 'Caprino stagionato'], 364, 22, 2.5, 30, 30, 'dairy'),
  food('mozzarella', ['Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella'], 254, 18, 3, 19, 60, 'dairy'),
  food('burrata', ['Burrata', 'Burrata', 'Burrata', 'Burrata', 'Burrata'], 330, 15, 2.5, 29, 60, 'dairy'),
  food('parmesan', ['Parmesan', 'Queijo parmesão', 'Queso parmesano', 'Parmesan', 'Parmigiano Reggiano'], 402, 36, 3.2, 26, 20, 'dairy'),
  food('pecorino', ['Pecorino', 'Pecorino', 'Pecorino', 'Pecorino', 'Pecorino'], 387, 26, 3.5, 30, 20, 'dairy'),
  food('ricotta', ['Ricotta', 'Ricotta', 'Ricotta', 'Ricotta', 'Ricotta'], 174, 11, 3, 13, 60, 'dairy'),
  food('mascarpone', ['Mascarpone', 'Mascarpone', 'Mascarpone', 'Mascarpone', 'Mascarpone'], 429, 4.5, 4.5, 44, 30, 'dairy'),
  food('feta', ['Feta', 'Queijo feta', 'Queso feta', 'Feta', 'Feta'], 264, 14, 4, 21, 40, 'dairy'),
  food('halloumi', ['Halloumi', 'Halloumi', 'Halloumi', 'Halloumi', 'Halloumi'], 321, 22, 2.4, 25, 60, 'dairy'),
  food('manchego', ['Manchego', 'Queijo manchego', 'Queso manchego', 'Manchego', 'Manchego'], 393, 25, 2, 32, 30, 'dairy'),
  food('gouda', ['Gouda', 'Queijo gouda', 'Queso gouda', 'Gouda', 'Gouda'], 356, 25, 2.2, 27, 30, 'dairy'),
  food('edam', ['Edam', 'Queijo edam', 'Queso edam', 'Edam', 'Edam'], 357, 25, 1.4, 28, 30, 'dairy'),
  food('cheddar', ['Cheddar', 'Queijo cheddar', 'Queso cheddar', 'Cheddar', 'Cheddar'], 403, 25, 1.3, 33, 30, 'dairy'),
  food('cream_cheese', ['Fromage à tartiner', 'Queijo creme', 'Queso para untar', 'Cream cheese', 'Formaggio spalmabile'], 253, 6, 4, 24, 30, 'dairy'),
  food('processed_cheese', ['Fromage fondu (portion)', 'Queijo fundido', 'Queso fundido', 'Processed cheese', 'Formaggino'], 271, 11, 6, 22, 20, 'dairy'),

  // ---------- Féculents ----------
  food2('rice_white', ['Riz blanc', 'Arroz branco', 'Arroz blanco', 'White rice', 'Riso bianco'], 'carbs', 'cooked', [365, 7.1, 80, 0.7, 60], [130, 2.7, 28, 0.3, 150]),
  food2('rice_brown', ['Riz complet', 'Arroz integral', 'Arroz integral', 'Brown rice', 'Riso integrale'], 'carbs', 'cooked', [370, 7.9, 77, 2.9, 60], [123, 2.7, 26, 1, 150]),
  food2('pasta', ['Pâtes', 'Massa', 'Pasta', 'Pasta', 'Pasta'], 'carbs', 'cooked', [371, 13, 75, 1.5, 80], [158, 5.8, 31, 0.9, 180]),
  food2('quinoa', ['Quinoa', 'Quinoa', 'Quinoa', 'Quinoa', 'Quinoa'], 'carbs', 'cooked', [368, 14, 64, 6, 60], [120, 4.4, 21, 1.9, 150]),
  food2('couscous', ['Semoule / couscous', 'Cuscuz', 'Cuscús', 'Couscous', 'Cuscus'], 'carbs', 'cooked', [376, 13, 77, 0.6, 60], [112, 3.8, 23, 0.2, 180]),
  food2('oats', ["Flocons d'avoine", 'Flocos de aveia', 'Copos de avena', 'Rolled oats', "Fiocchi d'avena"], 'carbs', 'raw', [379, 13, 68, 6.5, 50], [71, 2.4, 12, 1.4, 250]),
  food2('potato', ['Pomme de terre', 'Batata', 'Patata', 'Potato', 'Patata'], 'carbs', 'cooked', [77, 2, 17, 0.1, 220], [87, 2, 20, 0.1, 200]),
  food2('sweet_potato', ['Patate douce', 'Batata-doce', 'Boniato', 'Sweet potato', 'Patata dolce'], 'carbs', 'cooked', [86, 1.6, 20, 0.1, 220], [90, 2, 21, 0.1, 200]),
  food2('cassava', ['Manioc', 'Mandioca', 'Yuca', 'Cassava', 'Manioca'], 'carbs', 'cooked', [160, 1.4, 38, 0.3, 170], [125, 0.6, 30, 0.3, 150]),
  food('bread_whole', ['Pain complet', 'Pão integral', 'Pan integral', 'Wholemeal bread', 'Pane integrale'], 247, 13, 41, 3.4, 50, 'carbs'),
  food('baguette', ['Baguette / pain blanc', 'Pão branco', 'Pan blanco', 'White bread', 'Pane bianco'], 274, 9, 55, 1.5, 50, 'carbs'),
  food('pao_frances', ['Pain français (pãozinho)', 'Pão francês', 'Pan francés', 'Brazilian bread roll', 'Panino brasiliano'], 300, 8, 58, 3, 50, 'carbs'),
  food('bread_cereal', ['Pain aux céréales', 'Pão de cereais', 'Pan de cereales', 'Multigrain bread', 'Pane ai cereali'], 260, 10, 42, 5, 50, 'carbs'),
  food('sandwich_bread', ['Pain de mie', 'Pão de forma', 'Pan de molde', 'Sliced sandwich bread', 'Pancarré'], 265, 8, 48, 4, 50, 'carbs'),
  food('rusk', ['Biscotte', 'Tosta', 'Biscote', 'Rusk', 'Fetta biscottata'], 390, 12, 73, 5, 20, 'carbs'),
  food('tortilla', ['Tortilla / wrap', 'Tortilha / wrap', 'Tortilla / wrap', 'Tortilla wrap', 'Piadina / wrap'], 306, 8, 51, 7.5, 60, 'carbs'),
  food('corn', ['Maïs', 'Milho', 'Maíz', 'Sweetcorn', 'Mais'], 96, 3.4, 21, 1.5, 100, 'carbs'),
  food('farofa', ['Farofa', 'Farofa', 'Farofa', 'Farofa (toasted cassava flour)', 'Farofa'], 407, 2.5, 76, 10, 30, 'carbs'),
  food('tapioca', ['Galette de tapioca', 'Tapioca', 'Tapioca', 'Tapioca crepe', 'Crêpe di tapioca'], 240, 0.3, 59, 0.2, 80, 'carbs'),

  // ---------- Fruits ----------
  food('apple', ['Pomme', 'Maçã', 'Manzana', 'Apple', 'Mela'], 52, 0.3, 14, 0.2, 150, 'fruit'),
  food('banana', ['Banane', 'Banana', 'Plátano', 'Banana', 'Banana'], 89, 1.1, 23, 0.3, 120, 'fruit'),
  food('orange', ['Orange', 'Laranja', 'Naranja', 'Orange', 'Arancia'], 47, 0.9, 12, 0.1, 150, 'fruit'),
  food('strawberry', ['Fraises', 'Morangos', 'Fresas', 'Strawberries', 'Fragole'], 32, 0.7, 7.7, 0.3, 150, 'fruit'),
  food('blueberry', ['Myrtilles', 'Mirtilos', 'Arándanos', 'Blueberries', 'Mirtilli'], 57, 0.7, 14, 0.3, 100, 'fruit'),
  food('grapes', ['Raisin', 'Uvas', 'Uvas', 'Grapes', 'Uva'], 69, 0.7, 18, 0.2, 100, 'fruit'),
  food('mango', ['Mangue', 'Manga', 'Mango', 'Mango', 'Mango'], 60, 0.8, 15, 0.4, 150, 'fruit'),
  food('pineapple', ['Ananas', 'Ananás', 'Piña', 'Pineapple', 'Ananas'], 50, 0.5, 13, 0.1, 150, 'fruit'),
  food('kiwi', ['Kiwi', 'Kiwi', 'Kiwi', 'Kiwi', 'Kiwi'], 61, 1.1, 15, 0.5, 75, 'fruit'),
  food('watermelon', ['Pastèque', 'Melancia', 'Sandía', 'Watermelon', 'Anguria'], 30, 0.6, 7.6, 0.2, 200, 'fruit'),
  food('papaya', ['Papaye', 'Mamão', 'Papaya', 'Papaya', 'Papaya'], 43, 0.5, 11, 0.3, 150, 'fruit'),
  food('passion_fruit', ['Fruit de la passion', 'Maracujá', 'Maracuyá', 'Passion fruit', 'Frutto della passione'], 97, 2.2, 23, 0.7, 60, 'fruit'),
  food('acai', ['Açaí (pulpe)', 'Açaí (polpa)', 'Açaí (pulpa)', 'Açaí pulp', 'Açaí (polpa)'], 58, 0.8, 6.2, 3.9, 200, 'fruit'),
  food('guava', ['Goyave', 'Goiaba', 'Guayaba', 'Guava', 'Guava'], 68, 2.6, 14, 1, 150, 'fruit'),

  // ---------- Légumes ----------
  food('broccoli', ['Brocoli', 'Brócolos', 'Brócoli', 'Broccoli', 'Broccoli'], 34, 2.8, 7, 0.4, 150, 'veg'),
  food('carrot', ['Carotte', 'Cenoura', 'Zanahoria', 'Carrot', 'Carota'], 41, 0.9, 10, 0.2, 100, 'veg'),
  food('tomato', ['Tomate', 'Tomate', 'Tomate', 'Tomato', 'Pomodoro'], 18, 0.9, 3.9, 0.2, 120, 'veg'),
  food('zucchini', ['Courgette', 'Courgette', 'Calabacín', 'Courgette', 'Zucchina'], 17, 1.2, 3.1, 0.3, 150, 'veg'),
  food('spinach', ['Épinards', 'Espinafres', 'Espinacas', 'Spinach', 'Spinaci'], 23, 2.9, 3.6, 0.4, 100, 'veg'),
  food('lettuce', ['Salade verte', 'Alface', 'Lechuga', 'Lettuce', 'Lattuga'], 15, 1.4, 2.9, 0.2, 60, 'veg'),
  food('cucumber', ['Concombre', 'Pepino', 'Pepino', 'Cucumber', 'Cetriolo'], 15, 0.7, 3.6, 0.1, 100, 'veg'),
  food('pepper', ['Poivron', 'Pimento', 'Pimiento', 'Bell pepper', 'Peperone'], 26, 1, 6, 0.3, 100, 'veg'),
  food('onion', ['Oignon', 'Cebola', 'Cebolla', 'Onion', 'Cipolla'], 40, 1.1, 9.3, 0.1, 60, 'veg'),
  food('green_beans', ['Haricots verts', 'Feijão verde', 'Judías verdes', 'Green beans', 'Fagiolini'], 31, 1.8, 7, 0.1, 150, 'veg'),
  food('mushroom', ['Champignons', 'Cogumelos', 'Champiñones', 'Mushrooms', 'Funghi'], 22, 3.1, 3.3, 0.3, 100, 'veg'),
  food('cauliflower', ['Chou-fleur', 'Couve-flor', 'Coliflor', 'Cauliflower', 'Cavolfiore'], 25, 1.9, 5, 0.3, 150, 'veg'),
  food('cabbage_kale', ['Chou kale', 'Couve', 'Col rizada', 'Kale', 'Cavolo nero'], 49, 4.3, 9, 0.9, 100, 'veg'),
  food('eggplant', ['Aubergine', 'Beringela', 'Berenjena', 'Aubergine', 'Melanzana'], 25, 1, 6, 0.2, 150, 'veg'),

  // ---------- Matières grasses ----------
  food('olive_oil', ["Huile d'olive", 'Azeite', 'Aceite de oliva', 'Olive oil', "Olio d'oliva"], 884, 0, 0, 100, 10, 'fat'),
  food('butter', ['Beurre', 'Manteiga', 'Mantequilla', 'Butter', 'Burro'], 745, 0.9, 0.6, 82, 10, 'fat'),
  food('cream', ['Crème fraîche 30 %', 'Natas 30 %', 'Nata 30 %', 'Cream 30%', 'Panna 30%'], 292, 2.4, 3, 30, 30, 'fat'),
  food('avocado', ['Avocat', 'Abacate', 'Aguacate', 'Avocado', 'Avocado'], 160, 2, 8.5, 15, 100, 'fat'),
  food('almonds', ['Amandes', 'Amêndoas', 'Almendras', 'Almonds', 'Mandorle'], 579, 21, 22, 50, 30, 'fat'),
  food('walnuts', ['Noix', 'Nozes', 'Nueces', 'Walnuts', 'Noci'], 654, 15, 14, 65, 30, 'fat'),
  food('cashews', ['Noix de cajou', 'Castanha de caju', 'Anacardos', 'Cashews', 'Anacardi'], 553, 18, 30, 44, 30, 'fat'),
  food('brazil_nuts', ['Noix du Brésil', 'Castanha-do-pará', 'Nuez de Brasil', 'Brazil nuts', 'Noci del Brasile'], 659, 14, 12, 67, 20, 'fat'),
  food('peanut_butter', ['Beurre de cacahuète', 'Manteiga de amendoim', 'Crema de cacahuete', 'Peanut butter', 'Burro di arachidi'], 588, 25, 20, 50, 20, 'fat'),
  food('chia', ['Graines de chia', 'Sementes de chia', 'Semillas de chía', 'Chia seeds', 'Semi di chia'], 486, 17, 42, 31, 15, 'fat'),

  // ---------- Boissons ----------
  food('coffee', ['Café noir', 'Café preto', 'Café solo', 'Black coffee', 'Caffè nero'], 2, 0.1, 0, 0, 200, 'drink'),
  food('cappuccino', ['Cappuccino', 'Cappuccino', 'Capuchino', 'Cappuccino', 'Cappuccino'], 55, 3, 5.5, 2.2, 150, 'drink'),
  food('hot_chocolate', ['Chocolat chaud', 'Chocolate quente', 'Chocolate caliente', 'Hot chocolate', 'Cioccolata calda'], 80, 3.4, 11, 2.5, 200, 'drink'),
  food('tea', ['Thé', 'Chá', 'Té', 'Tea', 'Tè'], 1, 0, 0.2, 0, 200, 'drink'),
  food('orange_juice', ["Jus d'orange", 'Sumo de laranja', 'Zumo de naranja', 'Orange juice', "Succo d'arancia"], 45, 0.7, 10, 0.2, 200, 'drink'),
  food('apple_juice', ['Jus de pomme', 'Sumo de maçã', 'Zumo de manzana', 'Apple juice', 'Succo di mela'], 46, 0.1, 11, 0.1, 200, 'drink'),
  food('smoothie', ['Smoothie aux fruits', 'Batido de fruta', 'Smoothie de frutas', 'Fruit smoothie', 'Frullato di frutta'], 60, 0.7, 14, 0.2, 250, 'drink'),
  food('cola', ['Soda au cola', 'Refrigerante de cola', 'Refresco de cola', 'Cola soft drink', 'Bibita alla cola'], 42, 0, 10.6, 0, 330, 'drink'),
  food('cola_zero', ['Cola zéro', 'Cola zero', 'Cola zero', 'Diet cola', 'Cola zero'], 0.3, 0, 0, 0, 330, 'drink'),
  food('guarana', ['Guaraná (soda)', 'Guaraná', 'Guaraná', 'Guaraná soft drink', 'Guaraná'], 40, 0, 10, 0, 350, 'drink'),
  food('beer', ['Bière', 'Cerveja', 'Cerveza', 'Beer', 'Birra'], 43, 0.5, 3.6, 0, 250, 'drink'),
  food('red_wine', ['Vin rouge', 'Vinho tinto', 'Vino tinto', 'Red wine', 'Vino rosso'], 85, 0.1, 2.6, 0, 150, 'drink'),
  food('almond_milk', ["Lait d'amande", 'Bebida de amêndoa', 'Bebida de almendra', 'Almond milk', 'Bevanda di mandorla'], 24, 0.6, 3, 1.1, 200, 'drink'),

  // ---------- Petit-déjeuner et boulangerie ----------
  food('croissant', ['Croissant', 'Croissant', 'Cruasán', 'Croissant', 'Cornetto'], 406, 8, 46, 21, 60, 'snack'),
  food('pain_chocolat', ['Pain au chocolat', 'Pão de chocolate', 'Napolitana de chocolate', 'Chocolate pastry', 'Pain au chocolat'], 414, 7, 44, 23, 70, 'snack'),
  food('brioche', ['Brioche', 'Brioche', 'Brioche', 'Brioche', 'Brioche'], 350, 8, 50, 13, 50, 'snack'),
  food('pastel_nata', ['Pastel de nata', 'Pastel de nata', 'Pastel de nata', 'Portuguese custard tart', 'Pastel de nata'], 298, 5, 37, 14, 50, 'snack'),
  food('pao_de_queijo', ['Pão de queijo', 'Pão de queijo', 'Pan de queso', 'Brazilian cheese bread', 'Pane al formaggio'], 335, 6, 38, 17, 40, 'snack'),
  food('cornflakes', ['Céréales type corn flakes', 'Cereais tipo corn flakes', 'Cereales tipo corn flakes', 'Corn flakes', 'Corn flakes'], 378, 7, 84, 0.9, 40, 'carbs'),
  food('muesli', ['Muesli', 'Muesli', 'Muesli', 'Muesli', 'Muesli'], 360, 10, 60, 8, 50, 'carbs'),
  food('granola', ['Granola', 'Granola', 'Granola', 'Granola', 'Granola'], 450, 9, 60, 18, 50, 'carbs'),
  food('crepe', ['Crêpe', 'Crepe', 'Crepe', 'Pancake (crêpe)', 'Crêpe'], 190, 6, 25, 7, 60, 'snack'),
  food('pancake', ['Pancake', 'Panqueca', 'Tortita', 'Pancake', 'Pancake'], 227, 6, 28, 10, 60, 'snack'),
  food('waffle', ['Gaufre', 'Waffle', 'Gofre', 'Waffle', 'Waffle'], 291, 6.5, 33, 14, 60, 'snack'),
  food('jam', ['Confiture', 'Doce de fruta', 'Mermelada', 'Jam', 'Marmellata'], 250, 0.4, 62, 0.1, 20, 'snack'),
  food('honey', ['Miel', 'Mel', 'Miel', 'Honey', 'Miele'], 304, 0.3, 82, 0, 20, 'snack'),
  food('choco_spread', ['Pâte à tartiner chocolat', 'Creme de avelã', 'Crema de cacao', 'Chocolate hazelnut spread', 'Crema alla nocciola'], 539, 6, 57, 31, 20, 'snack'),
  food('doce_de_leite', ['Confiture de lait', 'Doce de leite', 'Dulce de leche', 'Dulce de leche', 'Dulce de leche'], 315, 6, 55, 7, 20, 'snack'),
  food('goiabada', ['Pâte de goyave', 'Goiabada', 'Dulce de guayaba', 'Guava paste', 'Goiabada'], 296, 0.4, 74, 0.1, 40, 'snack'),

  // ---------- En-cas ----------
  food('dark_chocolate', ['Chocolat noir', 'Chocolate preto', 'Chocolate negro', 'Dark chocolate', 'Cioccolato fondente'], 546, 5, 61, 31, 25, 'snack'),
  food('milk_chocolate', ['Chocolat au lait', 'Chocolate de leite', 'Chocolate con leche', 'Milk chocolate', 'Cioccolato al latte'], 535, 7.6, 59, 30, 25, 'snack'),
  food('brigadeiro', ['Brigadeiro', 'Brigadeiro', 'Brigadeiro', 'Brigadeiro', 'Brigadeiro'], 380, 4, 60, 14, 20, 'snack'),
  food('cookies', ['Biscuits', 'Bolachas', 'Galletas', 'Biscuits', 'Biscotti'], 480, 6, 65, 21, 30, 'snack'),
  food('chips', ['Chips', 'Batatas fritas de pacote', 'Patatas fritas de bolsa', 'Crisps', 'Patatine'], 536, 7, 53, 34, 30, 'snack'),
  food('ice_cream', ['Glace', 'Gelado', 'Helado', 'Ice cream', 'Gelato'], 207, 3.5, 24, 11, 100, 'snack'),

  // ---------- Plats ----------
  food('pizza', ['Pizza margherita', 'Pizza margherita', 'Pizza margarita', 'Margherita pizza', 'Pizza margherita'], 266, 11, 33, 10, 300, 'dish'),
  food('burger', ['Burger', 'Hambúrguer', 'Hamburguesa', 'Burger', 'Hamburger'], 295, 17, 24, 14, 220, 'dish'),
  food('fries', ['Frites', 'Batatas fritas', 'Patatas fritas', 'French fries', 'Patatine fritte'], 312, 3.4, 41, 15, 150, 'dish'),
  food('sushi', ['Sushi', 'Sushi', 'Sushi', 'Sushi', 'Sushi'], 145, 6, 26, 1.5, 200, 'dish'),
  food('sandwich_ham', ['Sandwich jambon-beurre', 'Sandes de fiambre', 'Bocadillo de jamón', 'Ham sandwich', 'Panino al prosciutto'], 260, 11, 33, 9, 200, 'dish'),
  food('bolognese', ['Pâtes bolognaise', 'Massa à bolonhesa', 'Pasta boloñesa', 'Spaghetti bolognese', 'Pasta al ragù'], 145, 7, 18, 4.5, 350, 'dish'),
  food('caesar_salad', ['Salade César', 'Salada César', 'Ensalada César', 'Caesar salad', 'Insalata Caesar'], 190, 10, 6, 14, 250, 'dish'),
  food('arroz_feijao', ['Riz-haricots (arroz e feijão)', 'Arroz e feijão', 'Arroz con frijoles', 'Rice and beans', 'Riso e fagioli'], 110, 4, 20, 1.5, 300, 'dish'),
  food('feijoada', ['Feijoada', 'Feijoada', 'Feijoada', 'Feijoada', 'Feijoada'], 180, 12, 12, 9, 300, 'dish'),
  food('moqueca', ['Moqueca de poisson', 'Moqueca de peixe', 'Moqueca de pescado', 'Fish moqueca', 'Moqueca di pesce'], 120, 11, 4, 7, 300, 'dish'),
  food('coxinha', ['Coxinha', 'Coxinha', 'Coxinha', 'Coxinha', 'Coxinha'], 280, 9, 30, 13, 80, 'dish'),
  food('pastel', ['Pastel frit', 'Pastel', 'Pastel frito', 'Fried pastel', 'Pastel fritto'], 340, 8, 33, 19, 80, 'dish'),
  food('bolinho_bacalhau', ['Beignet de morue', 'Bolinho de bacalhau', 'Buñuelo de bacalao', 'Salt cod fritter', 'Frittella di baccalà'], 260, 11, 22, 14, 60, 'dish'),
  food('caldo_verde', ['Caldo verde', 'Caldo verde', 'Caldo verde', 'Caldo verde soup', 'Caldo verde'], 65, 2.5, 8, 2.5, 250, 'dish'),

  // ---------- Sport et compléments ----------
  food('whey', ['Whey (poudre)', 'Whey (pó)', 'Whey (polvo)', 'Whey protein powder', 'Whey (polvere)'], 400, 80, 8, 6, 30, 'supplement'),
  food('casein', ['Caséine (poudre)', 'Caseína (pó)', 'Caseína (polvo)', 'Casein powder', 'Caseina (polvere)'], 370, 78, 6, 3, 30, 'supplement'),
  food('gainer', ['Gainer (poudre)', 'Gainer (pó)', 'Gainer (polvo)', 'Mass gainer powder', 'Gainer (polvere)'], 380, 20, 65, 4, 100, 'supplement'),
  food('protein_drink', ['Boisson protéinée prête', 'Bebida proteica pronta', 'Bebida proteica lista', 'Ready-to-drink protein shake', 'Bevanda proteica pronta'], 55, 10, 2, 0.5, 330, 'supplement'),
  food('protein_bar', ['Barre protéinée', 'Barra proteica', 'Barrita proteica', 'Protein bar', 'Barretta proteica'], 350, 30, 35, 9, 60, 'supplement'),
  food('energy_bar', ['Barre énergétique', 'Barra energética', 'Barrita energética', 'Energy bar', 'Barretta energetica'], 380, 6, 60, 12, 50, 'supplement'),
  food('energy_gel', ['Gel énergétique', 'Gel energético', 'Gel energético', 'Energy gel', 'Gel energetico'], 250, 0, 62, 0, 40, 'supplement'),
  food('isotonic', ['Boisson isotonique', 'Bebida isotónica', 'Bebida isotónica', 'Isotonic sports drink', 'Bevanda isotonica'], 24, 0, 6, 0, 500, 'supplement'),
  food('maltodextrin', ['Maltodextrine', 'Maltodextrina', 'Maltodextrina', 'Maltodextrin', 'Maltodestrine'], 380, 0, 95, 0, 30, 'supplement'),
  food('bcaa', ['BCAA (poudre)', 'BCAA (pó)', 'BCAA (polvo)', 'BCAA powder', 'BCAA (polvere)'], 400, 98, 0, 0, 10, 'supplement'),
  food('creatine', ['Créatine', 'Creatina', 'Creatina', 'Creatine monohydrate', 'Creatina'], 0, 0, 0, 0, 5, 'supplement'),
]

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
  if (!q) return foods
  const scored = foods
    .map((item) => {
      const labelList = [item.name, ...Object.values(item.i18n ?? {})].map(normalize)
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
