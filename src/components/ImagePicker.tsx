import { useRef } from 'react'
import { StorageImage } from './StorageImage'

export function ImagePicker({ previewUrl, currentImagePath, onSelect, label = 'Добавить фото' }: {
  previewUrl?: string
  currentImagePath?: string | null
  onSelect: (file: File) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="image-picker">
      <button type="button" className="image-picker__button" onClick={() => inputRef.current?.click()}>
        {previewUrl ? (
          <img src={previewUrl} alt="Предпросмотр" />
        ) : currentImagePath ? (
          <div className="image-picker__current">
            <StorageImage path={currentImagePath} alt="Текущее изображение" className="image-picker__current-image" objectFit="contain" />
            <span>Нажмите, чтобы заменить</span>
          </div>
        ) : (
          <span className="image-picker__empty"><b>📷</b>{label}<small>WebP или JPEG после сжатия</small></span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onSelect(file)
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}
