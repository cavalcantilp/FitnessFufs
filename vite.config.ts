import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Sur GitHub Pages le site est servi depuis /<nom-du-dépôt>/ ; le workflow
// injecte BASE_PATH pour que le chemin suive tout renommage du dépôt.
// Pour un déploiement à la racine d'un domaine, builder avec BASE_PATH=/
const base = process.env.BASE_PATH ?? '/myFitnessFufs/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'myFitnessFufs',
        short_name: 'FitnessFufs',
        description: 'Suivi des calories, des macros et du poids — 100 % hors ligne.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
