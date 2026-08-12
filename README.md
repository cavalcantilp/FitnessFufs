# FitnessFufs

PWA de suivi nutritionnel : journal alimentaire, objectifs caloriques et macros
calculés à partir du profil, et suivi du poids. Application React construite avec
Vite, installable sur mobile et utilisable hors ligne.

Toutes les données restent dans le `localStorage` de l'appareil — aucun compte,
aucun serveur, aucun envoi de données.

## Fonctionnalités

- **Journal quotidien** — quatre repas, navigation jour par jour, recopie du jour
  précédent, anneau de progression calorique et barres de macros. La fiche de
  quantité affiche les calories en tête des macros, recalculées à la frappe.
- **Base d'aliments** — plus de 300 aliments avec valeurs pour 100 g, recherche
  insensible aux accents et portant sur les libellés des cinq langues. Fromages
  français, italiens et européens, spécialités brésiliennes et portugaises,
  viandes et poissons, boulangerie, compléments sportifs.
- **Fibres** — renseignées sur tous les aliments, suivies comme une quatrième
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
  si elles ne sont pas saisies, mise en favori. Tout aliment personnel ou importé
  se corrige : les données Open Food Facts viennent de saisies communautaires et
  peuvent différer de l'étiquette qu'on a sous les yeux.
- **Favoris** — l'étoile épingle un aliment en tête de liste, filtre compris, et
  le confirme par un message nommant l'aliment. Ce retour n'est pas décoratif :
  la première utilisatrice a cru que l'étoile remplissait le journal et s'est
  étonnée de n'y rien voir arriver. L'onglet Favoris vide explique donc le geste
  au lieu de proposer de créer un aliment.
- **Mesures ménagères** — unité, cuillère, tranche, verre, pot, poignée,
  dosette : « deux cuillères de skyr » se saisit tel quel, sans convertir.
- **Open Food Facts** — quand la table intégrée ne suffit pas, une recherche
  complémentaire interroge la base ouverte (licence ODbL, sans clé d'API), à la
  demande seulement. Tout produit retenu est recopié dans les aliments
  personnels et reste donc disponible hors ligne.
- **Code-barres** — lecture plein écran par la caméra, native sur Chrome et
  Android, avec un décodeur WebAssembly en repli ailleurs. Le binaire est servi
  depuis le domaine de l'application, jamais depuis un CDN, et mis en cache au
  premier usage. Le bouton n'apparaît que sur les appareils à pointeur grossier
  — téléphones et tablettes — un ordinateur de bureau ne s'y prêtant pas.
- **Objectifs** — métabolisme de base (Mifflin-St Jeor), dépense estimée selon le
  niveau d'activité, ajustement selon l'objectif de poids. L'apport ne descend
  jamais sous le métabolisme de base ; sous ce plancher l'objectif retenu cesse
  de suivre les réglages, alors une ligne « objectif demandé » et un message
  disent lequel bouge encore et pourquoi l'autre est bloqué.
- **Répartition des macros** — même modèle que le calculateur dédié du
  portefeuille : deux curseurs en grammes par kilo de poids de corps, protéines
  (0,8 à 3,0) et lipides (0,5 à 2,5), les glucides absorbant le solde calorique.
  Cinq programmes (équilibré, riche en protéines, pauvre en glucides, cétogène,
  endurance) positionnent les curseurs ; les bouger repasse en « personnalisé ».
  Trois cartes et un anneau donnent le résultat en direct. Si protéines et
  lipides saturent l'objectif, les glucides tombent à zéro et l'alerte chiffre
  le dépassement plutôt que de laisser croire l'affichage figé.
- **Macros du jour** — une journée peut s'écarter du profil : mêmes programme et
  curseurs, repliés derrière une flèche dans le journal, avec une étiquette
  « personnalisées » sur l'en-tête et un retour en un geste. Rien n'est recopié
  à l'avance : les journées non personnalisées suivent le profil, donc un
  réglage modifié après coup s'y propage. Une case du profil garde le panneau
  déplié sur toutes les journées.
- **Calendrier** — vue mensuelle plein écran, doublée d'un suivi d'habitude.
  Chaque jour renseigné affiche quatre barres (calories, protéines, glucides,
  lipides, identifiées par une puce de couleur rappelée une fois en tête du
  calendrier) centrées sur l'objectif : le remplissage part du milieu et
  s'étend à droite en cas de dépassement, à gauche en cas de déficit, coloré
  du vert au rouge selon l'ampleur de l'écart — dans un sens comme dans
  l'autre, une barre courte reste l'idéal. Le contour d'un jour verdit quand
  les calories sont respectées à 10 % près ; la case entière verdit quand
  calories et les trois macros le sont toutes. Deux séries en
  bas d'écran comptent les jours consécutifs dans chaque cas, en s'arrêtant
  net au premier jour sans aucune saisie. Une pression brève ne fait que
  déplacer le contour du jour ; il faut rester appuyé trois secondes — un
  anneau de progression comble l'attente — pour ouvrir son journal. La note
  libre d'un jour, elle, se consulte et se modifie depuis le journal, par une
  icône à côté de la date : un simple toucher du calendrier ne doit jamais
  faire apparaître de clavier par surprise. Un jour noté porte une petite
  icône dans le calendrier. On change de mois par les flèches ou, au doigt, par un
  balayage horizontal — retenu seulement s'il est franchement horizontal,
  pour ne pas confisquer le défilement de la page. La grille compte cinq ou
  six semaines selon le mois. L'onglet et le jour consultés sont conservés au
  rechargement.
- **Suivi** — deux colonnes de même hauteur en tête d'écran : la courbe de
  poids à gauche, occupant toute la hauteur disponible, résultats (IMC,
  dernières mesures) à droite. Chaque courbe (poids et mesures) reprend une
  présentation façon suivi boursier — valeur en avant, écart et pourcentage
  depuis le début de la période, date de la dernière saisie, sélecteur de
  période (1 mois / 3 mois / 6 mois / 1 an / tout) — pour donner une notion de
  temps que la seule ligne ne portait pas. L'IMC est lu sur une jauge à cinq
  bandes colorées (insuffisance et obésité en rouge, poids idéal en vert,
  surpoids en jaune, obésité morbide en bordeaux) avec une flèche indiquant la
  position actuelle. Un tout petit bouton « + » en bas à droite des résultats
  ouvre un pop-up minimal pour enregistrer une pesée. Mesures corporelles
  (tour de taille, de hanches, de poitrine), facultatives et indépendantes les
  unes des autres — une entrée peut n'en renseigner qu'une seule — repliées
  derrière une flèche, avec leur propre courbe d'évolution une fois deux
  mesures enregistrées. L'historique — poids et mesures — vit sur une page à
  part, ouverte par un bouton en bas d'écran plutôt qu'affiché en permanence.
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

Le site est servi depuis **https://fitnessfufs.cavalcantilp.com**, déclaré dans
`public/CNAME` (le fichier est copié tel quel dans `dist/`). Deux réglages à
faire une fois :

1. **DNS** — chez le registrar de `cavalcantilp.com`, ajouter un enregistrement
   `CNAME` : `fitnessfufs` → `cavalcantilp.github.io`.
2. **GitHub** — Settings → Pages → Custom domain : `fitnessfufs.cavalcantilp.com`,
   puis cocher *Enforce HTTPS* une fois le certificat émis.

**L'ordre compte.** Fusionner cette branche déclenche le déploiement, qui écrit
`fitnessfufs.cavalcantilp.com` dans les réglages Pages du dépôt. Si le CNAME
DNS n'existe pas encore, GitHub ne peut pas vérifier le domaine et le site
devient inaccessible — l'ancien sous-domaine ayant déjà été remplacé. Créer
donc l'enregistrement DNS **avant** de fusionner, puis rouvrir Settings → Pages
pour recocher *Enforce HTTPS* une fois le certificat émis, ce qui prend
quelques minutes.

L'ancien sous-domaine `myfitnessfufs.cavalcantilp.com` cesse alors de répondre.
Le laisser pointer vers `cavalcantilp.github.io` ne sert à rien : un dépôt Pages
ne reconnaît qu'un seul domaine personnalisé, les autres reçoivent une erreur.
Autant supprimer l'ancien enregistrement DNS une fois la bascule constatée.

Le domaine apex `cavalcantilp.com` reste au dépôt `cavalcantilp-web-apps` : un
domaine ne peut pointer que vers un seul site Pages, d'où le sous-domaine.

Le build utilise donc `base: '/'`. Sans domaine personnalisé, GitHub Pages sert
depuis `https://cavalcantilp.github.io/<nom-du-dépôt>/` : builder alors avec
`BASE_PATH=/<nom-du-dépôt>/ npm run build`. Le dépôt s'appelle aujourd'hui
`myFitnessFufs` ; le renommer ne touche pas au domaine personnalisé, qui ne
dépend que de `public/CNAME`.

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
└── pages/        onboarding, calendrier, journal, ajout, suivi (poids,
                mesures, historique), profil
```
