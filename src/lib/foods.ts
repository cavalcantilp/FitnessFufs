import type { Food, FoodCategory, Lang } from './types'

/** Libellés dans l'ordre : fr, pt, es, en, it. */
type Names = [string, string, string, string, string]

const LANG_ORDER: Lang[] = ['fr', 'pt', 'es', 'en', 'it']

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
  const i18n: Partial<Record<Lang, string>> = {}
  LANG_ORDER.forEach((lang, index) => {
    i18n[lang] = names[index]
  })
  return { id, name: names[0], i18n, per100: { kcal, protein, carbs, fat }, serving, category }
}

/**
 * Base d'aliments intégrée. Valeurs pour 100 g (ou 100 ml pour les boissons),
 * arrondies à partir des tables de composition usuelles.
 */
export const BUILTIN_FOODS: Food[] = [
  // Protéines
  food('chicken_breast', ['Blanc de poulet', 'Peito de frango', 'Pechuga de pollo', 'Chicken breast', 'Petto di pollo'], 165, 31, 0, 3.6, 120, 'protein'),
  food('chicken_thigh', ['Cuisse de poulet', 'Coxa de frango', 'Muslo de pollo', 'Chicken thigh', 'Coscia di pollo'], 209, 26, 0, 11, 130, 'protein'),
  food('turkey', ['Escalope de dinde', 'Peito de peru', 'Pechuga de pavo', 'Turkey breast', 'Fesa di tacchino'], 135, 29, 0, 1.5, 120, 'protein'),
  food('beef_mince', ['Bœuf haché 5 %', 'Carne moída 5 %', 'Carne picada 5 %', 'Lean beef mince 5%', 'Macinato di manzo 5%'], 137, 21, 0, 5, 125, 'protein'),
  food('steak', ['Steak de bœuf', 'Bife de vaca', 'Filete de ternera', 'Beef steak', 'Bistecca di manzo'], 217, 26, 0, 12, 150, 'protein'),
  food('pork_loin', ['Filet de porc', 'Lombo de porco', 'Lomo de cerdo', 'Pork loin', 'Lombo di maiale'], 143, 26, 0, 4, 120, 'protein'),
  food('ham', ['Jambon blanc', 'Fiambre', 'Jamón cocido', 'Cooked ham', 'Prosciutto cotto'], 107, 18, 1, 3.5, 40, 'protein'),
  food('bacon', ['Bacon', 'Bacon', 'Bacon', 'Bacon', 'Pancetta'], 300, 24, 1, 22, 30, 'protein'),
  food('salmon', ['Saumon', 'Salmão', 'Salmón', 'Salmon', 'Salmone'], 208, 20, 0, 13, 130, 'protein'),
  food('tuna_can', ['Thon au naturel', 'Atum ao natural', 'Atún al natural', 'Canned tuna in water', 'Tonno al naturale'], 116, 26, 0, 1, 80, 'protein'),
  food('cod', ['Cabillaud', 'Bacalhau fresco', 'Bacalao fresco', 'Cod', 'Merluzzo'], 82, 18, 0, 0.7, 130, 'protein'),
  food('shrimp', ['Crevettes', 'Camarão', 'Gambas', 'Shrimp', 'Gamberi'], 99, 24, 0.2, 0.3, 100, 'protein'),
  food('egg', ['Œuf entier', 'Ovo inteiro', 'Huevo entero', 'Whole egg', 'Uovo intero'], 143, 13, 0.7, 9.5, 55, 'protein'),
  food('egg_white', ["Blanc d'œuf", 'Clara de ovo', 'Clara de huevo', 'Egg white', "Albume d'uovo"], 52, 11, 0.7, 0.2, 33, 'protein'),
  food('tofu', ['Tofu ferme', 'Tofu firme', 'Tofu firme', 'Firm tofu', 'Tofu compatto'], 144, 15, 3, 8, 100, 'protein'),
  food('lentils', ['Lentilles cuites', 'Lentilhas cozidas', 'Lentejas cocidas', 'Cooked lentils', 'Lenticchie cotte'], 116, 9, 20, 0.4, 150, 'protein'),
  food('chickpeas', ['Pois chiches cuits', 'Grão-de-bico cozido', 'Garbanzos cocidos', 'Cooked chickpeas', 'Ceci cotti'], 164, 8.9, 27, 2.6, 150, 'protein'),
  food('kidney_beans', ['Haricots rouges cuits', 'Feijão vermelho cozido', 'Alubias rojas cocidas', 'Cooked kidney beans', 'Fagioli rossi cotti'], 127, 8.7, 22.8, 0.5, 150, 'protein'),

  // Produits laitiers
  food('milk_semi', ['Lait demi-écrémé', 'Leite meio-gordo', 'Leche semidesnatada', 'Semi-skimmed milk', 'Latte parzialmente scremato'], 46, 3.4, 4.8, 1.6, 200, 'dairy'),
  food('yogurt_plain', ['Yaourt nature', 'Iogurte natural', 'Yogur natural', 'Plain yogurt', 'Yogurt bianco'], 61, 3.5, 4.7, 3.3, 125, 'dairy'),
  food('skyr', ['Skyr / fromage blanc 0 %', 'Skyr / queijo quark 0 %', 'Skyr / queso batido 0 %', 'Skyr / fat-free quark', 'Skyr / fiocchi magri'], 63, 11, 4, 0.2, 150, 'dairy'),
  food('greek_yogurt', ['Yaourt grec', 'Iogurte grego', 'Yogur griego', 'Greek yogurt', 'Yogurt greco'], 97, 9, 3.6, 5, 150, 'dairy'),
  food('cheese_hard', ['Comté / emmental', 'Queijo curado', 'Queso curado', 'Hard cheese', 'Formaggio stagionato'], 380, 27, 1.5, 29, 30, 'dairy'),
  food('mozzarella', ['Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella'], 254, 18, 3, 19, 60, 'dairy'),
  food('feta', ['Feta', 'Queijo feta', 'Queso feta', 'Feta', 'Feta'], 264, 14, 4, 21, 40, 'dairy'),

  // Féculents
  food('rice_white', ['Riz blanc cuit', 'Arroz branco cozido', 'Arroz blanco cocido', 'Cooked white rice', 'Riso bianco cotto'], 130, 2.7, 28, 0.3, 150, 'carbs'),
  food('rice_brown', ['Riz complet cuit', 'Arroz integral cozido', 'Arroz integral cocido', 'Cooked brown rice', 'Riso integrale cotto'], 123, 2.7, 26, 1, 150, 'carbs'),
  food('pasta', ['Pâtes cuites', 'Massa cozida', 'Pasta cocida', 'Cooked pasta', 'Pasta cotta'], 158, 5.8, 31, 0.9, 180, 'carbs'),
  food('bread_whole', ['Pain complet', 'Pão integral', 'Pan integral', 'Wholemeal bread', 'Pane integrale'], 247, 13, 41, 3.4, 50, 'carbs'),
  food('baguette', ['Baguette / pain blanc', 'Pão branco', 'Pan blanco', 'White bread', 'Pane bianco'], 274, 9, 55, 1.5, 50, 'carbs'),
  food('potato', ['Pomme de terre cuite', 'Batata cozida', 'Patata cocida', 'Boiled potato', 'Patata lessa'], 87, 2, 20, 0.1, 200, 'carbs'),
  food('sweet_potato', ['Patate douce cuite', 'Batata-doce cozida', 'Boniato cocido', 'Cooked sweet potato', 'Patata dolce cotta'], 90, 2, 21, 0.1, 200, 'carbs'),
  food('quinoa', ['Quinoa cuit', 'Quinoa cozida', 'Quinoa cocida', 'Cooked quinoa', 'Quinoa cotta'], 120, 4.4, 21, 1.9, 150, 'carbs'),
  food('oats', ["Flocons d'avoine", 'Flocos de aveia', 'Copos de avena', 'Rolled oats', "Fiocchi d'avena"], 379, 13, 68, 6.5, 50, 'carbs'),
  food('couscous', ['Semoule / couscous cuit', 'Cuscuz cozido', 'Cuscús cocido', 'Cooked couscous', 'Cuscus cotto'], 112, 3.8, 23, 0.2, 180, 'carbs'),
  food('tortilla', ['Tortilla / wrap', 'Tortilha / wrap', 'Tortilla / wrap', 'Tortilla wrap', 'Piadina / wrap'], 306, 8, 51, 7.5, 60, 'carbs'),
  food('corn', ['Maïs', 'Milho', 'Maíz', 'Sweetcorn', 'Mais'], 96, 3.4, 21, 1.5, 100, 'carbs'),

  // Fruits
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

  // Légumes
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

  // Matières grasses
  food('olive_oil', ["Huile d'olive", 'Azeite', 'Aceite de oliva', 'Olive oil', "Olio d'oliva"], 884, 0, 0, 100, 10, 'fat'),
  food('butter', ['Beurre', 'Manteiga', 'Mantequilla', 'Butter', 'Burro'], 745, 0.9, 0.6, 82, 10, 'fat'),
  food('cream', ['Crème fraîche 30 %', 'Natas 30 %', 'Nata 30 %', 'Cream 30%', 'Panna 30%'], 292, 2.4, 3, 30, 30, 'fat'),
  food('avocado', ['Avocat', 'Abacate', 'Aguacate', 'Avocado', 'Avocado'], 160, 2, 8.5, 15, 100, 'fat'),
  food('almonds', ['Amandes', 'Amêndoas', 'Almendras', 'Almonds', 'Mandorle'], 579, 21, 22, 50, 30, 'fat'),
  food('walnuts', ['Noix', 'Nozes', 'Nueces', 'Walnuts', 'Noci'], 654, 15, 14, 65, 30, 'fat'),
  food('peanut_butter', ['Beurre de cacahuète', 'Manteiga de amendoim', 'Crema de cacahuete', 'Peanut butter', 'Burro di arachidi'], 588, 25, 20, 50, 20, 'fat'),
  food('chia', ['Graines de chia', 'Sementes de chia', 'Semillas de chía', 'Chia seeds', 'Semi di chia'], 486, 17, 42, 31, 15, 'fat'),

  // Boissons
  food('coffee', ['Café noir', 'Café preto', 'Café solo', 'Black coffee', 'Caffè nero'], 2, 0.1, 0, 0, 200, 'drink'),
  food('tea', ['Thé', 'Chá', 'Té', 'Tea', 'Tè'], 1, 0, 0.2, 0, 200, 'drink'),
  food('orange_juice', ["Jus d'orange", 'Sumo de laranja', 'Zumo de naranja', 'Orange juice', "Succo d'arancia"], 45, 0.7, 10, 0.2, 200, 'drink'),
  food('cola', ['Soda au cola', 'Refrigerante de cola', 'Refresco de cola', 'Cola soft drink', 'Bibita alla cola'], 42, 0, 10.6, 0, 330, 'drink'),
  food('cola_zero', ['Cola zéro', 'Cola zero', 'Cola zero', 'Diet cola', 'Cola zero'], 0.3, 0, 0, 0, 330, 'drink'),
  food('beer', ['Bière', 'Cerveja', 'Cerveza', 'Beer', 'Birra'], 43, 0.5, 3.6, 0, 250, 'drink'),
  food('red_wine', ['Vin rouge', 'Vinho tinto', 'Vino tinto', 'Red wine', 'Vino rosso'], 85, 0.1, 2.6, 0, 150, 'drink'),
  food('almond_milk', ["Lait d'amande", 'Bebida de amêndoa', 'Bebida de almendra', 'Almond milk', 'Bevanda di mandorla'], 24, 0.6, 3, 1.1, 200, 'drink'),

  // En-cas
  food('dark_chocolate', ['Chocolat noir', 'Chocolate preto', 'Chocolate negro', 'Dark chocolate', 'Cioccolato fondente'], 546, 5, 61, 31, 25, 'snack'),
  food('milk_chocolate', ['Chocolat au lait', 'Chocolate de leite', 'Chocolate con leche', 'Milk chocolate', 'Cioccolato al latte'], 535, 7.6, 59, 30, 25, 'snack'),
  food('cookies', ['Biscuits', 'Bolachas', 'Galletas', 'Biscuits', 'Biscotti'], 480, 6, 65, 21, 30, 'snack'),
  food('chips', ['Chips', 'Batatas fritas de pacote', 'Patatas fritas de bolsa', 'Crisps', 'Patatine'], 536, 7, 53, 34, 30, 'snack'),
  food('protein_bar', ['Barre protéinée', 'Barra proteica', 'Barrita proteica', 'Protein bar', 'Barretta proteica'], 350, 30, 35, 9, 60, 'snack'),
  food('whey', ['Whey (poudre)', 'Whey (pó)', 'Whey (polvo)', 'Whey protein powder', 'Whey (polvere)'], 400, 80, 8, 6, 30, 'snack'),
  food('ice_cream', ['Glace', 'Gelado', 'Helado', 'Ice cream', 'Gelato'], 207, 3.5, 24, 11, 100, 'snack'),

  // Plats
  food('pizza', ['Pizza margherita', 'Pizza margherita', 'Pizza margarita', 'Margherita pizza', 'Pizza margherita'], 266, 11, 33, 10, 300, 'dish'),
  food('burger', ['Burger', 'Hambúrguer', 'Hamburguesa', 'Burger', 'Hamburger'], 295, 17, 24, 14, 220, 'dish'),
  food('fries', ['Frites', 'Batatas fritas', 'Patatas fritas', 'French fries', 'Patatine fritte'], 312, 3.4, 41, 15, 150, 'dish'),
  food('sushi', ['Sushi', 'Sushi', 'Sushi', 'Sushi', 'Sushi'], 145, 6, 26, 1.5, 200, 'dish'),
  food('sandwich_ham', ['Sandwich jambon-beurre', 'Sandes de fiambre', 'Bocadillo de jamón', 'Ham sandwich', 'Panino al prosciutto'], 260, 11, 33, 9, 200, 'dish'),
  food('bolognese', ['Pâtes bolognaise', 'Massa à bolonhesa', 'Pasta boloñesa', 'Spaghetti bolognese', 'Pasta al ragù'], 145, 7, 18, 4.5, 350, 'dish'),
  food('caesar_salad', ['Salade César', 'Salada César', 'Ensalada César', 'Caesar salad', 'Insalata Caesar'], 190, 10, 6, 14, 250, 'dish'),
  food('croissant', ['Croissant', 'Croissant', 'Cruasán', 'Croissant', 'Cornetto'], 406, 8, 46, 21, 60, 'dish'),
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
]

export function foodName(food: Food, lang: Lang): string {
  return food.i18n?.[lang] ?? food.name
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
      const labels = [item.name, ...Object.values(item.i18n ?? {})].map(normalize)
      const best = labels.reduce((acc, label) => {
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
