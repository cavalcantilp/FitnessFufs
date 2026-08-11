// Copie le décodeur de codes-barres WebAssembly dans public/.
//
// Le paquet zxing-wasm n'expose pas son .wasm dans sa carte d'exports, et sa
// version compilée irait le chercher sur un CDN : on le sert donc depuis notre
// propre domaine, ce qui préserve la politique de sécurité de la page et permet
// au service worker de le mettre en cache pour l'usage hors ligne.
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, 'public/zxing_reader.wasm')

// La carte d'exports du paquet ne publie ni le .wasm ni son package.json :
// on va le chercher directement dans node_modules.
const source = resolve(root, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')

await mkdir(resolve(root, 'public'), { recursive: true })
await copyFile(source, target)
const { size } = await stat(target)
console.log(`zxing_reader.wasm → public/ (${(size / 1024).toFixed(0)} kB)`)
