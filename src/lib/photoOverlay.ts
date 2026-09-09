/** Charge un fichier image dans un <img> exploitable par un canvas, sans fuite d'URL objet. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    img.src = url
  })
}

/**
 * Incruste les lignes fournies (date, poids, mesures) en bas de la photo, sur un
 * bandeau semi-transparent — directement dans les pixels de l'image enregistrée,
 * pour que la donnée reste lisible même si le poids ou les mesures changent
 * ensuite dans le journal.
 */
export async function compositeProgressPhoto(file: File, lines: string[]): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')

  ctx.drawImage(img, 0, 0)

  if (lines.length > 0) {
    const fontSize = Math.max(16, Math.round(canvas.width / 22))
    const lineHeight = Math.round(fontSize * 1.35)
    const padding = Math.round(fontSize * 0.7)
    const bandHeight = padding * 2 + lineHeight * lines.length
    const bandTop = canvas.height - bandHeight

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, bandTop, canvas.width, bandHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`
    ctx.textBaseline = 'top'
    lines.forEach((line, index) => {
      ctx.fillText(line, padding, bandTop + padding + index * lineHeight)
    })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Échec de l'export de l'image"))),
      'image/jpeg',
      0.9,
    )
  })
}
