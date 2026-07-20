export type OptimizedImage = {
  blob: Blob
  extension: 'webp' | 'jpg'
  previewUrl: string
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось прочитать изображение'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
}

export async function optimizeImage(file: File | Blob, maxSide = 1800, quality = 0.84): Promise<OptimizedImage> {
  const image = await loadImage(file)
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * ratio))
  const height = Math.max(1, Math.round(image.naturalHeight * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Ваш браузер не поддерживает обработку изображений')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)

  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  let extension: 'webp' | 'jpg' = 'webp'

  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    extension = 'jpg'
  }

  if (!blob) throw new Error('Не удалось сжать изображение')
  return { blob, extension, previewUrl: URL.createObjectURL(blob) }
}
