import { createStore, del, entries, get, set } from 'idb-keyval'

/**
 * Les photos (avec leur incrustation date/poids/mesures déjà « cuite » dans
 * l'image) ne rentreraient pas dans localStorage — plafonné à quelques Mo,
 * pas prévu pour des fichiers binaires. IndexedDB, via ce petit store dédié,
 * stocke le Blob tel quel, sans conversion en texte.
 */
const store = createStore('fitnessfufs-photos', 'photos')

interface StoredPhoto {
  blob: Blob
  date: string
  createdAt: string
}

export interface ProgressPhoto {
  id: string
  date: string
  createdAt: string
}

export async function saveProgressPhoto(date: string, blob: Blob): Promise<void> {
  const id = `${date}-${Date.now()}`
  await set(id, { blob, date, createdAt: new Date().toISOString() } satisfies StoredPhoto, store)
}

/** Le plus récent d'abord — c'est l'ordre dans lequel on veut les feuilleter. */
export async function listProgressPhotos(): Promise<ProgressPhoto[]> {
  const all = await entries<string, StoredPhoto>(store)
  return all
    .map(([id, value]) => ({ id, date: value.date, createdAt: value.createdAt }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getProgressPhotoBlob(id: string): Promise<Blob | undefined> {
  const value = await get<StoredPhoto>(id, store)
  return value?.blob
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  await del(id, store)
}
