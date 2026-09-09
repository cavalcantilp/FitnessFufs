import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { ProgressPhotoSheet } from './ProgressPhotoSheet'
import { ConfirmDialog } from './ConfirmDialog'
import { deleteProgressPhoto, getProgressPhotoBlob, listProgressPhotos, type ProgressPhoto } from '../lib/progressPhotos'
import { formatDay } from '../lib/date'
import { IconPlus, IconTrash } from './icons'
import type { Lang } from '../lib/types'

interface ProgressPhotoGalleryProps {
  onToast: (message: string) => void
}

/** Vignette chargée à part : le Blob ne vient d'IndexedDB qu'au moment d'afficher la photo. */
function Thumbnail({ photo, lang, onOpen }: { photo: ProgressPhoto; lang: Lang; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    void getProgressPhotoBlob(photo.id).then((blob) => {
      if (!blob || !active) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photo.id])

  return (
    <button type="button" className="photo-thumb" onClick={onOpen} aria-label={formatDay(photo.date, lang)}>
      {url ? <img src={url} alt="" /> : null}
    </button>
  )
}

export function ProgressPhotoGallery({ onToast }: ProgressPhotoGalleryProps) {
  const { t, lang } = useApp()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [adding, setAdding] = useState(false)
  const [viewing, setViewing] = useState<{ photo: ProgressPhoto; url: string } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const refresh = () => {
    void listProgressPhotos().then(setPhotos)
  }

  useEffect(refresh, [])

  const openPhoto = async (photo: ProgressPhoto) => {
    const blob = await getProgressPhotoBlob(photo.id)
    if (!blob) return
    setViewing({ photo, url: URL.createObjectURL(blob) })
  }

  const closeViewer = () => {
    if (viewing) URL.revokeObjectURL(viewing.url)
    setViewing(null)
  }

  const removePhoto = async () => {
    if (!viewing) return
    await deleteProgressPhoto(viewing.photo.id)
    setConfirmingDelete(false)
    closeViewer()
    refresh()
    onToast(t('photo.deleted'))
  }

  return (
    <div className="card stack">
      <div className="card-title">{t('photo.title')}</div>

      {photos.length === 0 ? <p className="hint">{t('photo.empty')}</p> : null}

      <div className="photo-row">
        <button type="button" className="photo-thumb photo-add" onClick={() => setAdding(true)} aria-label={t('photo.add')}>
          <IconPlus size={22} />
        </button>
        {photos.map((photo) => (
          <Thumbnail key={photo.id} photo={photo} lang={lang} onOpen={() => void openPhoto(photo)} />
        ))}
      </div>

      {adding ? (
        <ProgressPhotoSheet
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            refresh()
            onToast(t('photo.saved'))
          }}
        />
      ) : null}

      {viewing ? (
        <div className="photo-viewer" role="dialog" aria-modal="true">
          <div className="photo-viewer-head">
            <span>{formatDay(viewing.photo.date, lang)}</span>
            <div className="photo-viewer-actions">
              <button type="button" className="icon-btn danger" onClick={() => setConfirmingDelete(true)} aria-label={t('common.delete')}>
                <IconTrash size={18} />
              </button>
              <button type="button" className="btn secondary" onClick={closeViewer}>
                {t('common.close')}
              </button>
            </div>
          </div>
          <img src={viewing.url} alt="" className="photo-viewer-img" />
        </div>
      ) : null}

      {confirmingDelete ? (
        <ConfirmDialog
          message={t('photo.deleteConfirm')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          danger
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => void removePhoto()}
        />
      ) : null}
    </div>
  )
}
