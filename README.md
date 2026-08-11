# myFitnessFufs

PWA de suivi nutritionnel : journal alimentaire, objectifs caloriques et macros
calculés à partir du profil, et suivi du poids. Application React construite avec
Vite, installable sur mobile et utilisable hors ligne.

Toutes les données restent dans le `localStorage` de l'appareil — aucun compte,
aucun serveur, aucun envoi de données.

## Fonctionnalités

- **Journal quotidien** — quatre repas, navigation jour par jour, recopie du jour
  précédent, anneau de progression calorique et barres de macros.
- **Base d'aliments** — près de 200 aliments avec valeurs pour 100 g, recherche
  insensible aux accents et portant sur les libellés des cinq langues. Fromages
  français, italiens et européens, spécialités brésiliennes et portugaises,
  viandes et poissons, boulangerie, compléments sportifs.
- **Fibres** — renseignées sur les 197 aliments, suivies comme une quatrième
  barre avec un objectif de 14 g pour 1000 kcal (plancher à 25 g).
- **Micronutriments** — sodium, potassium, calcium, fer, magnésium, zinc et
  vitamines C, D et B12, repliés derrière une flèche dans la fiche d'aliment et
  dans le résumé du jour, avec le pourcentage des apports de référence. Le
  sodium se lit comme un plafond et passe en rouge au-delà de 100 %.
  Renseignés sur 145 aliments bruts ; les plats composés, viennoiseries et
  compléments sont laissés vides plutôt que remplis au jugé, et le total du
  jour indique la part des calories réellement couvertes.
- **Cru ou cuit** — 35 aliments (féculents, légumineuses, viandes, poissons)
  proposent les deux états : 100 g de riz cru valent 365 kcal, 100 g de riz cuit
  130 kcal. Une bascule dans la fiche recalcule les macros et la portion usuelle,
  et l'état pesé est mémorisé dans le journal.
- **Aliments personnalisés** — création à la volée, calories déduites des macros
  si elles ne sont pas saisies, mise en favori.
- **Objectifs** — métabolisme de base (Mifflin-St Jeor), dépense estimée selon le
  niveau d'activité, ajustement selon l'objectif de poids. L'apport ne descend
  jamais sous le métabolisme de base.
- **Répartition des macros** — même modèle que le calculateur dédié du
  portefeuille : deux curseurs en grammes par kilo de poids de corps, protéines
  (0,8 à 3,0) et lipides (0,5 à 2,5), les glucides absorbant le solde calorique.
  Cinq programmes (équilibré, riche en protéines, pauvre en glucides, cétogène,
  endurance) positionnent les curseurs ; les bouger repasse en « personnalisé ».
  Trois cartes et un anneau donnent le résultat en direct.
- **Poids** — pesée quotidienne, courbe d'évolution, variations totale et sur
  7 jours, IMC.
- **Multilingue** — français, portugais, espagnol, anglais, italien ; la langue de
  l'appareil est détectée à la première ouverture.
- **Import / export JSON** — sauvegarde et restauration complètes des données.

## Développement

```bash
npm install
npm run dev        # serveur de développement
npm run build      # vérification TypeScript puis build de production
npm run preview    # sert le build de production
```

Les icônes PNG de `public/` sont générées à partir des sources SVG du script :

```bash
npm install --no-save sharp
node scripts/generate-icons.mjs
```

## Déploiement

Le workflow `.github/workflows/deploy.yml` build et publie `dist/` sur GitHub
Pages à chaque push sur `main`.

**Étape manuelle, une seule fois :** aller dans **Settings → Pages → Build and
deployment → Source : GitHub Actions**, puis relancer le workflow. Le
`GITHUB_TOKEN` du workflow n'a pas le droit de créer le site Pages lui-même
(`Create Pages site failed: Resource not accessible by integration`), donc tant
que ce réglage n'est pas fait l'étape `configure-pages` échoue.

### Domaine personnalisé

Le site est servi depuis **https://myfitnessfufs.cavalcantilp.com**, déclaré
dans `public/CNAME` (le fichier est copié tel quel dans `dist/`). Deux réglages
à faire une fois :

1. **DNS** — chez le registrar de `cavalcantilp.com`, ajouter un enregistrement
   `CNAME` : `myfitnessfufs` → `cavalcantilp.github.io`.
2. **GitHub** — Settings → Pages → Custom domain : `myfitnessfufs.cavalcantilp.com`,
   puis cocher *Enforce HTTPS* une fois le certificat émis.

Le domaine apex `cavalcantilp.com` reste au dépôt `cavalcantilp-web-apps` : un
domaine ne peut pointer que vers un seul site Pages, d'où le sous-domaine.

Le build utilise donc `base: '/'`. Sans domaine personnalisé, GitHub Pages sert
depuis `https://cavalcantilp.github.io/myFitnessFufs/` : builder alors avec
`BASE_PATH=/myFitnessFufs/ npm run build`.

## Ajouter un aliment

Éditer `src/lib/foods.ts` :

```ts
// État unique : id, libellés fr/pt/es/en/it, kcal, P, G, L, fibres, portion,
// catégorie, puis les micronutriments — facultatifs, à omettre si incertains.
food('feta', ['Feta', 'Queijo feta', 'Queso feta', 'Feta', 'Feta'], 264, 14, 4, 21, 0, 40, 'dairy',
     [1100, 60, 490, 0.7, 19, 2.9, 0, 0.4, 1.7]),

// Deux états : catégorie, état par défaut, puis [kcal, P, G, L, fibres, portion]
// cru puis cuit, et enfin les micronutriments de l'état par défaut.
food2('pasta', ['Pâtes', 'Massa', 'Pasta', 'Pasta', 'Pasta'], 'carbs', 'cooked',
      [371, 13, 75, 1.5, 3.2, 80], [158, 5.8, 31, 0.9, 1.8, 180],
      [5, 44, 7, 0.5, 18, 0.5, 0, 0, 0]),
```

Les micronutriments vont dans l'ordre sodium, potassium, calcium, fer,
magnésium, zinc, vitamine C, vitamine D, vitamine B12 — les six premiers en
milligrammes, les vitamines D et B12 en microgrammes.

## Structure

```
src/
├── lib/          nutrition (BMR/TDEE/macros), base d'aliments, dates, stockage
├── i18n/         dictionnaires des cinq langues
├── state/        contexte applicatif et persistance
├── components/   anneau, barres de macros, graphique de poids, feuilles modales
└── pages/        onboarding, journal, ajout, poids, profil
```
