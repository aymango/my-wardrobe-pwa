import type { CanvasData } from './types'
import { downloadBlob } from './storage'

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось загрузить вещь для превью'))
    }
    image.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Не удалось создать превью')), type, quality)
  })
}

export async function createOutfitPreview(canvasData: CanvasData): Promise<Blob> {
  const scale = 2.5
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(canvasData.width * scale)
  canvas.height = Math.round(canvasData.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas недоступен')

  ctx.fillStyle = '#FAFAF8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const sortedItems = [...canvasData.items].sort((a, b) => a.z_index - b.z_index)
  for (const item of sortedItems) {
    const blob = await downloadBlob(item.image_path)
    const image = await blobToImage(blob)
    const displayWidth = item.width * scale
    const ratio = image.naturalHeight / image.naturalWidth
    const displayHeight = displayWidth * ratio
    const centerX = (item.x + item.width / 2) * scale
    const centerY = (item.y + (item.width * ratio) / 2) * scale

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((item.rotation * Math.PI) / 180)
    ctx.drawImage(image, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight)
    ctx.restore()
  }

  return toBlob(canvas)
}
