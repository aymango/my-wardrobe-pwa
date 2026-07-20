import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CANVAS_HEIGHT, CANVAS_WIDTH, CATEGORIES } from '../lib/constants'
import type { CanvasData, CanvasItem, Clothing, Outfit } from '../lib/types'
import { createOutfitPreview } from '../lib/outfitPreview'
import { removeStorageFiles, uploadBlob } from '../lib/storage'
import { StorageImage } from '../components/StorageImage'
import { CategoryTag } from '../components/CategoryTag'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'

const emptyCanvas: CanvasData = { version: 1, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, items: [] }

type PointerPoint = { x: number; y: number }
type Gesture = {
  mode: 'drag' | 'pinch'
  itemId: string
  startPointerX: number
  startPointerY: number
  startX: number
  startY: number
  startWidth: number
  startRotation: number
  startDistance: number
  startAngle: number
}

function distance(a: PointerPoint, b: PointerPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function angle(a: PointerPoint, b: PointerPoint) {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
}

export function OutfitBuilderPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const canvasRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef(new Map<number, PointerPoint>())
  const gestureRef = useRef<Gesture | null>(null)

  const [clothes, setClothes] = useState<Clothing[]>([])
  const [existing, setExisting] = useState<Outfit | null>(null)
  const [canvas, setCanvas] = useState<CanvasData>(emptyCanvas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerCategory, setPickerCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState({ title: '', comment: '', occasion: '', outfit_date: '', is_favorite: false })

  useEffect(() => {
    let active = true
    async function load() {
      const { data: clothingData, error: clothingError } = await supabase.from('clothes').select('*').order('created_at', { ascending: false })
      if (!active) return
      if (clothingError) setError(clothingError.message)
      const loadedClothes = (clothingData || []) as Clothing[]
      setClothes(loadedClothes)

      if (id) {
        const { data: outfitData, error: outfitError } = await supabase.from('outfits').select('*').eq('id', id).single()
        if (!active) return
        if (outfitError || !outfitData) {
          setError('Образ не найден')
        } else {
          const outfit = outfitData as Outfit
          setExisting(outfit)
          setCanvas(outfit.canvas_data || emptyCanvas)
          setMeta({
            title: outfit.title,
            comment: outfit.comment || '',
            occasion: outfit.occasion || '',
            outfit_date: outfit.outfit_date || '',
            is_favorite: outfit.is_favorite
          })
        }
      } else {
        const initialItemId = searchParams.get('item')
        const initialItem = loadedClothes.find((item) => item.id === initialItemId)
        if (initialItem) {
          const canvasItem: CanvasItem = {
            id: crypto.randomUUID(), clothing_id: initialItem.id, image_path: initialItem.image_path,
            x: 110, y: 145, width: 140, rotation: 0, z_index: 1
          }
          setCanvas({ ...emptyCanvas, items: [canvasItem] })
          setSelectedId(canvasItem.id)
        }
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [id, searchParams])

  const selected = useMemo(() => canvas.items.find((item) => item.id === selectedId) || null, [canvas.items, selectedId])
  const filteredClothes = useMemo(() => pickerCategory ? clothes.filter((item) => item.category === pickerCategory) : clothes, [clothes, pickerCategory])

  function updateItem(itemId: string, patch: Partial<CanvasItem>) {
    setCanvas((current) => ({ ...current, items: current.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) }))
  }

  function addClothing(item: Clothing) {
    const maxZ = canvas.items.reduce((max, value) => Math.max(max, value.z_index), 0)
    const newItem: CanvasItem = {
      id: crypto.randomUUID(), clothing_id: item.id, image_path: item.image_path,
      x: 110 + (canvas.items.length % 3) * 12,
      y: 130 + (canvas.items.length % 3) * 12,
      width: 140,
      rotation: 0,
      z_index: maxZ + 1
    }
    setCanvas((current) => ({ ...current, items: [...current.items, newItem] }))
    setSelectedId(newItem.id)
    setPickerOpen(false)
  }

  function removeSelected() {
    if (!selectedId) return
    setCanvas((current) => ({ ...current, items: current.items.filter((item) => item.id !== selectedId) }))
    setSelectedId(null)
  }

  function changeLayer(direction: 'front' | 'back') {
    if (!selected) return
    const zValues = canvas.items.map((item) => item.z_index)
    updateItem(selected.id, { z_index: direction === 'front' ? Math.max(...zValues) + 1 : Math.min(...zValues) - 1 })
  }

  function beginGesture(event: ReactPointerEvent<HTMLDivElement>, item: CanvasItem) {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedId(item.id)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const points = Array.from(pointersRef.current.values())
    if (points.length >= 2) {
      gestureRef.current = {
        mode: 'pinch', itemId: item.id,
        startPointerX: 0, startPointerY: 0,
        startX: item.x, startY: item.y,
        startWidth: item.width, startRotation: item.rotation,
        startDistance: Math.max(1, distance(points[0], points[1])),
        startAngle: angle(points[0], points[1])
      }
    } else {
      gestureRef.current = {
        mode: 'drag', itemId: item.id,
        startPointerX: event.clientX, startPointerY: event.clientY,
        startX: item.x, startY: item.y,
        startWidth: item.width, startRotation: item.rotation,
        startDistance: 1, startAngle: 0
      }
    }
  }

  function moveGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId) || !gestureRef.current || !canvasRef.current) return
    event.preventDefault()
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const gesture = gestureRef.current
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const points = Array.from(pointersRef.current.values())

    if (points.length >= 2) {
      if (gesture.mode !== 'pinch') {
        const currentItem = canvas.items.find((item) => item.id === gesture.itemId)
        if (!currentItem) return
        gestureRef.current = {
          ...gesture,
          mode: 'pinch',
          startWidth: currentItem.width,
          startRotation: currentItem.rotation,
          startDistance: Math.max(1, distance(points[0], points[1])),
          startAngle: angle(points[0], points[1])
        }
        return
      }
      const width = Math.max(60, Math.min(320, gesture.startWidth * distance(points[0], points[1]) / gesture.startDistance))
      const rotation = gesture.startRotation + angle(points[0], points[1]) - gesture.startAngle
      updateItem(gesture.itemId, { width, rotation })
    } else if (gesture.mode === 'drag') {
      const dx = (event.clientX - gesture.startPointerX) * scaleX
      const dy = (event.clientY - gesture.startPointerY) * scaleY
      updateItem(gesture.itemId, {
        x: Math.max(-gesture.startWidth * 0.65, Math.min(CANVAS_WIDTH - gesture.startWidth * 0.35, gesture.startX + dx)),
        y: Math.max(-80, Math.min(CANVAS_HEIGHT - 60, gesture.startY + dy))
      })
    }
  }

  function endGesture(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size === 0) gestureRef.current = null
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (!meta.title.trim()) return setError('Введите название образа')
    if (!canvas.items.length) return setError('Добавьте хотя бы одну вещь на холст')

    setBusy(true)
    setError('')
    setProgress(15)
    let newPreviewPath = ''

    try {
      const normalizedCanvas: CanvasData = { ...canvas, items: [...canvas.items].sort((a, b) => a.z_index - b.z_index) }
      setProgress(35)
      const previewBlob = await createOutfitPreview(normalizedCanvas)
      setProgress(62)
      newPreviewPath = await uploadBlob(user.id, 'outfits', previewBlob, 'webp')
      setProgress(82)

      const payload = {
        user_id: user.id,
        title: meta.title.trim(),
        comment: meta.comment.trim() || null,
        occasion: meta.occasion.trim() || null,
        outfit_date: meta.outfit_date || null,
        is_favorite: meta.is_favorite,
        preview_image_path: newPreviewPath,
        canvas_data: normalizedCanvas
      }

      if (isEdit && id) {
        const { error: updateError } = await supabase.from('outfits').update(payload).eq('id', id)
        if (updateError) throw updateError
        await removeStorageFiles([existing?.preview_image_path])
        setProgress(100)
        navigate(`/outfits/${id}`, { replace: true })
      } else {
        const { data, error: insertError } = await supabase.from('outfits').insert(payload).select('id').single()
        if (insertError) throw insertError
        setProgress(100)
        navigate(`/outfits/${data.id}`, { replace: true })
      }
    } catch (err) {
      if (newPreviewPath) await removeStorageFiles([newPreviewPath])
      setError(err instanceof Error ? err.message : 'Не удалось сохранить образ')
      setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="page page--builder">
      <PageHeader title={isEdit ? 'Редактировать образ' : 'Новый образ'} back />

      <div className="builder-toolbar">
        <button className="button button--primary button--small" onClick={() => setPickerOpen(true)}>＋ Добавить вещь</button>
        <span>{canvas.items.length} на холсте</span>
      </div>

      <div
        ref={canvasRef}
        className="outfit-canvas"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setSelectedId(null)
        }}
      >
        {canvas.items.length === 0 && <div className="canvas-empty"><span>✨</span><b>Добавьте вещи</b><small>Перемещайте пальцем, масштабируйте и поворачивайте двумя пальцами</small></div>}
        {[...canvas.items].sort((a, b) => a.z_index - b.z_index).map((item) => (
          <div
            key={item.id}
            className={`canvas-item ${selectedId === item.id ? 'canvas-item--selected' : ''}`}
            style={{
              left: `${item.x / CANVAS_WIDTH * 100}%`,
              top: `${item.y / CANVAS_HEIGHT * 100}%`,
              width: `${item.width / CANVAS_WIDTH * 100}%`,
              transform: `rotate(${item.rotation}deg)`,
              zIndex: item.z_index
            }}
            onPointerDown={(event) => beginGesture(event, item)}
            onPointerMove={moveGesture}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
          >
            <StorageImage path={item.image_path} alt="Вещь в образе" className="canvas-item__image" objectFit="contain" />
          </div>
        ))}
      </div>

      {selected && (
        <div className="canvas-controls">
          <div className="control-row"><span>Размер</span><input type="range" min="60" max="320" value={Math.round(selected.width)} onChange={(e) => updateItem(selected.id, { width: Number(e.target.value) })} /></div>
          <div className="control-row"><span>Поворот</span><input type="range" min="-180" max="180" value={Math.round(selected.rotation)} onChange={(e) => updateItem(selected.id, { rotation: Number(e.target.value) })} /></div>
          <div className="canvas-control-buttons">
            <button onClick={() => changeLayer('back')}>На слой назад</button>
            <button onClick={() => changeLayer('front')}>На слой вперёд</button>
            <button className="danger-text" onClick={removeSelected}>Удалить</button>
          </div>
        </div>
      )}

      <form className="form-stack builder-form" onSubmit={save}>
        <label className="field"><span>Название *</span><input required value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Например: Прогулка вечером" /></label>
        <label className="field"><span>Комментарий</span><textarea rows={4} value={meta.comment} onChange={(e) => setMeta({ ...meta, comment: e.target.value })} placeholder="Надеть с серебряными украшениями…" /></label>
        <label className="field"><span>Повод</span><input value={meta.occasion} onChange={(e) => setMeta({ ...meta, occasion: e.target.value })} placeholder="Необязательно" /></label>
        <label className="field"><span>Дата</span><input type="date" value={meta.outfit_date} onChange={(e) => setMeta({ ...meta, outfit_date: e.target.value })} /></label>
        <label className="switch-row"><input type="checkbox" checked={meta.is_favorite} onChange={(e) => setMeta({ ...meta, is_favorite: e.target.checked })} /><span><b>Любимый образ</b><small>Показывать на главной</small></span></label>
        {error && <div className="error-box">{error}</div>}
        {progress > 0 && <div className="upload-progress"><div style={{ width: `${progress}%` }} /><span>{progress < 100 ? 'Создаю превью и сохраняю…' : 'Готово'}</span></div>}
        <button className="button button--primary button--full form-submit" disabled={busy}>{busy ? 'Сохраняю…' : 'Сохранить образ'}</button>
      </form>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Выбрать вещь" variant="sheet">
        <div className="picker-categories">
          <button className={!pickerCategory ? 'chip chip--selected' : 'chip'} onClick={() => setPickerCategory('')}>Все</button>
          {Object.keys(CATEGORIES).map((category) => <button key={category} className={pickerCategory === category ? 'chip chip--selected' : 'chip'} onClick={() => setPickerCategory(category)}>{category}</button>)}
        </div>
        <div className="clothing-picker-grid">
          {filteredClothes.map((item) => (
            <button key={item.id} className="clothing-picker-card" onClick={() => addClothing(item)}>
              <StorageImage path={item.image_path} alt={item.subcategory || item.category} className="clothing-picker-card__image" objectFit="contain" />
              <CategoryTag category={item.category} label={item.subcategory || item.category} />
            </button>
          ))}
        </div>
        {!filteredClothes.length && <p className="muted">В этой категории пока нет вещей.</p>}
      </Modal>
    </div>
  )
}
