import { useEffect, useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { IconCamera } from './icons'
import { useApp } from '../state/AppContext'
import { compositeProgressPhoto } from '../lib/photoOverlay'
import { saveProgressPhoto } from '../lib/progressPhotos'
import { formatDateNumeric, todayKey } from '../lib/date'
import { MEASUREMENT_KEYS, MEASUREMENT_UNIT } from '../lib/measurements'
import type { TranslationKey } from '../i18n/translations'

interface ProgressPhotoSheetProps {
  onClose: () => void
  onSaved: () => void
}

/**
 * Prise de photo suivie d'une incrustation date/poids/mesures — la donnée est
 * « cuite » dans l'image au moment de l'enregistrer, jamais recalculée plus
 * tard : une photo doit rester le reflet de l'état du jour où elle a été prise.
 */
export function ProgressPhotoSheet({ onClose, onSaved }: ProgressPhotoSheetProps) {
  const { t, lang, weights, measurements, profile } = useApp()
  const fileInput = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  const today = todayKey()
  const latestWeight = weights.length ? weights[weights.length - 1] : null
  const currentWeight = latestWeight?.weight ?? profile.weight
  const latestMeasurements = measurements.length ? measurements[measurements.length - 1] : null

  const overlayLines = [
    formatDateNumeric(today, lang),
    `${currentWeight} kg`,
    ...MEASUREMENT_KEYS.filter((key) => latestMeasurements?.values[key] !== undefined).map(
      (key) => `${t(`measure.${key}` as TranslationKey)} ${latestMeasurements!.values[key]} ${MEASUREMENT_UNIT}`,
    ),
  ]

  const onPick = async (file: File) => {
    setError(null)
    try {
      const blob = await compositeProgressPhoto(file, overlayLines)
      setPreview({ blob, url: URL.createObjectURL(blob) })
    } catch {
      setError(t('photo.error'))
    }
  }

  const retake = () => {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const save = async () => {
    if (!preview) return
    setSaving(true)
    try {
      await saveProgressPhoto(today, preview.blob)
      onSaved()
    } catch {
      setError(t('photo.error'))
      setSaving(false)
    }
  }

  return (
    <Sheet title={t('photo.add')} subtitle={overlayLines.join(' · ')} onClose={onClose}>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onPick(file)
        }}
      />

      {error ? <p className="notice chat-error">{error}</p> : null}

      {preview ? (
        <div className="stack">
          <img src={preview.url} alt="" className="photo-preview" />
          <div className="meal-btn-row">
            <button type="button" className="btn secondary" onClick={retake} disabled={saving}>
              {t('photo.retake')}
            </button>
            <button type="button" className="btn" onClick={save} disabled={saving}>
              {t('common.save')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn photo-capture" onClick={() => fileInput.current?.click()}>
          <IconCamera size={20} />
          {t('photo.take')}
        </button>
      )}
    </Sheet>
  )
}
