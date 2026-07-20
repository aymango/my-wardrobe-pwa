import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CATEGORIES, COLORS, SEASONS } from '../lib/constants'
import type { Clothing } from '../lib/types'
import { optimizeImage, type OptimizedImage } from '../lib/image'
import { removeStorageFiles, uploadBlob } from '../lib/storage'
import { ImagePicker } from '../components/ImagePicker'
import { MultiSelectTags } from '../components/MultiSelectTags'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'

export function ClothingFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState<Clothing | null>(null)
  const [optimized, setOptimized] = useState<OptimizedImage | null>(null)
  const [form, setForm] = useState({
    category: '', subcategory: '', colors: [] as string[], seasons: [] as string[], style: '', last_worn_date: '', notes: ''
  })

  useEffect(() => {
    if (!id) return
    supabase.from('clothes').select('*').eq('id', id).single().then(({ data, error: loadError }) => {
      if (loadError || !data) {
        setError('Вещь не найдена')
      } else {
        const item = data as Clothing
        setExisting(item)
        setForm({
          category: item.category,
          subcategory: item.subcategory || '',
          colors: item.colors || [],
          seasons: item.seasons || [],
          style: item.style || '',
          last_worn_date: item.last_worn_date || '',
          notes: item.notes || ''
        })
      }
      setLoading(false)
    })
  }, [id])

  useEffect(() => () => { if (optimized?.previewUrl) URL.revokeObjectURL(optimized.previewUrl) }, [optimized])

  async function selectImage(file: File) {
    setError('')
    setProgress(15)
    try {
      const next = await optimizeImage(file)
      if (optimized?.previewUrl) URL.revokeObjectURL(optimized.previewUrl)
      setOptimized(next)
      setProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обработать фото')
      setProgress(0)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (!form.category) return setError('Выберите категорию')
    if (!isEdit && !optimized) return setError('Добавьте фотографию вещи')

    setBusy(true)
    setError('')
    setProgress(25)
    let newImagePath = existing?.image_path || ''

    try {
      if (optimized) {
        setProgress(55)
        newImagePath = await uploadBlob(user.id, 'clothes', optimized.blob, optimized.extension)
        setProgress(78)
      }

      const payload = {
        user_id: user.id,
        image_path: newImagePath,
        category: form.category,
        subcategory: form.subcategory || null,
        colors: form.colors,
        seasons: form.seasons,
        style: form.style.trim() || null,
        last_worn_date: form.last_worn_date || null,
        notes: form.notes.trim() || null
      }

      if (isEdit && id) {
        const { error: updateError } = await supabase.from('clothes').update(payload).eq('id', id)
        if (updateError) throw updateError
        if (optimized && existing?.image_path && existing.image_path !== newImagePath) await removeStorageFiles([existing.image_path])
        setProgress(100)
        navigate(`/clothes/${id}`, { replace: true })
      } else {
        const { data, error: insertError } = await supabase.from('clothes').insert(payload).select('id').single()
        if (insertError) throw insertError
        setProgress(100)
        navigate(`/clothes/${data.id}`, { replace: true })
      }
    } catch (err) {
      if (optimized && newImagePath && newImagePath !== existing?.image_path) await removeStorageFiles([newImagePath])
      setError(err instanceof Error ? err.message : 'Не удалось сохранить вещь')
      setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="page page--form">
      <PageHeader title={isEdit ? 'Редактировать вещь' : 'Добавить вещь'} back />
      <form className="form-stack" onSubmit={submit}>
        <ImagePicker previewUrl={optimized?.previewUrl} currentImagePath={existing?.image_path} onSelect={selectImage} />

        <label className="field"><span>Категория *</span><select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}><option value="">Выберите категорию</option>{Object.keys(CATEGORIES).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Подкатегория</span><select value={form.subcategory} disabled={!form.category} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}><option value="">Можно не выбирать</option>{(CATEGORIES[form.category] || []).map((value) => <option key={value}>{value}</option>)}</select></label>

        <fieldset className="field-group"><legend>Цвета</legend><MultiSelectTags options={COLORS} value={form.colors} onChange={(colors) => setForm({ ...form, colors })} ariaLabel="Цвета вещи" /></fieldset>
        <fieldset className="field-group"><legend>Сезоны</legend><MultiSelectTags options={SEASONS} value={form.seasons} onChange={(seasons) => setForm({ ...form, seasons })} ariaLabel="Сезоны вещи" /></fieldset>

        <label className="field"><span>Стиль</span><input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="Например: casual, офисный" /></label>
        <label className="field"><span>Дата последней носки</span><input type="date" value={form.last_worn_date} onChange={(e) => setForm({ ...form, last_worn_date: e.target.value })} /></label>
        <label className="field"><span>Заметки</span><textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Посадка, сочетания, особенности…" /></label>

        {error && <div className="error-box">{error}</div>}
        {progress > 0 && <div className="upload-progress"><div style={{ width: `${progress}%` }} /><span>{progress < 100 ? 'Сохраняю…' : 'Готово'}</span></div>}
        <button className="button button--primary button--full form-submit" disabled={busy}>{busy ? 'Сохраняю…' : 'Сохранить'}</button>
      </form>
    </div>
  )
}
