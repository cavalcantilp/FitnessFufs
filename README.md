# myFitnessFufs

PWA de suivi nutritionnel : journal alimentaire, objectifs caloriques et macros
calculés à partir du profil, et suivi du poids. Application React construite avec
Vite, installable sur mobile et utilisable hors ligne.

Toutes les données restent dans le `localStorage` de l'appareil — aucun compte,
aucun serveur, aucun envoi de données.

## Fonctionnalités

- **Journal quotidien** — quatre repas, navigation jour par jour, recopie du jour
  précédent, anneau de progression calorique et barres de macros.
- **Base d'aliments** — près de 90 aliments courants avec valeurs pour 100 g,
  recherche insensible aux accents et sur les libellés des cinq langues.
- **Aliments personnalisés** — création à la volée, calories déduites des macros
  si elles ne sont pas saisies, mise en favori.
- **Objectifs** — métabolisme de base (Mifflin-St Jeor), dépense estimée selon le
  niveau d'activité, ajustement selon l'objectif de poids, répartition des macros
  parmi quatre préréglages ou une répartition personnalisée. L'apport ne descend
  jamais sous le métabolisme de base.
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

Le site est alors servi depuis `https://cavalcantilp.github.io/myFitnessFufs/`.
Le workflow passe le nom du dépôt au build via `BASE_PATH`, donc le chemin suit
automatiquement un éventuel renommage. Pour un déploiement à la racine d'un
domaine, builder avec `BASE_PATH=/ npm run build`.

## Structure

```
src/
├── lib/          nutrition (BMR/TDEE/macros), base d'aliments, dates, stockage
├── i18n/         dictionnaires des cinq langues
├── state/        contexte applicatif et persistance
├── components/   anneau, barres de macros, graphique de poids, feuilles modales
└── pages/        onboarding, journal, ajout, poids, profil
```
