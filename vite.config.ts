import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Le site est servi à la racine du domaine personnalisé déclaré dans
// public/CNAME. Sans domaine personnalisé, GitHub Pages sert depuis
// /<nom-du-dépôt>/ : builder alors avec BASE_PATH=/myFitnessFufs/
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Le décodeur WebAssembly (1 Mo) reste hors du précache : seuls les
        // navigateurs sans lecteur de codes-barres natif en ont besoin. Il est
        // mis en cache au premier scan, et disponible hors ligne ensuite.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /zxing_reader\.wasm$/,
            handler: 'CacheFirst',
            options: { cacheName: 'barcode-decoder', expiration: { maxEntries: 1 } },
          },
        ],
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
