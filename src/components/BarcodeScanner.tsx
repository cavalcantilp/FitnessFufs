import { useEffect, useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { useApp } from '../state/AppContext'

/**
 * Le repli WebAssembly va chercher son binaire sur un CDN par défaut, ce qui
 * romprait à la fois la promesse hors ligne et la politique de sécurité de la
 * page. Le script prebuild le copie dans public/, et il est donc servi depuis
 * le domaine de l'application puis mis en cache par le service worker.
 */
const wasmUrl = `${import.meta.env.BASE_URL}zxing_reader.wasm`

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const

interface DetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}

/**
 * Chrome et Android savent lire un code-barres nativement ; ailleurs — iOS
 * notamment — on charge le décodeur WebAssembly, mais seulement à ce
 * moment-là, pour ne pas alourdir le démarrage de tout le monde.
 */
async function createDetector(): Promise<DetectorLike> {
  const native = (globalThis as { BarcodeDetector?: new (options: unknown) => DetectorLike })
    .BarcodeDetector
  if (native) return new native({ formats: FORMATS })

  const { BarcodeDetector, setZXingModuleOverrides } = await import('barcode-detector/ponyfill')
  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
  })
  return new BarcodeDetector({ formats: [...FORMATS] }) as unknown as DetectorLike
}

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const { t } = useApp()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let stopped = false

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })
        if (stopped) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const detector = await createDetector()
        const tick = async () => {
          if (stopped || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const [found] = await detector.detect(videoRef.current)
            if (found?.rawValue) {
              stopped = true
              onDetect(found.rawValue)
              return
            }
          } catch {
            // Image illisible sur cette trame : on retente à la suivante.
          }
          timer = window.setTimeout(tick, 400)
        }
        timer = window.setTimeout(tick, 400)
      } catch (cause) {
        const name = (cause as { name?: string })?.name
        setError(name === 'NotAllowedError' ? t('scan.denied') : t('scan.unavailable'))
      }
    }

    void start()
    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [onDetect, t])

  return (
    <Sheet title={t('scan.title')} subtitle={t('scan.hint')} onClose={onClose}>
      {error ? (
        <p className="notice">{error}</p>
      ) : (
        <div className="scanner">
          <video ref={videoRef} playsInline muted />
          <div className="scanner-frame" />
        </div>
      )}
    </Sheet>
  )
}
