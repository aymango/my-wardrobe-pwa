import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Idea } from '../lib/types'
import { optimizeImage, type OptimizedImage } from '../lib/image'
import { removeStorageFiles, uploadBlob } from '../lib/storage'
import { ImagePicker } from '../components/ImagePicker'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'

export function IdeaFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(isEdit)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState<Idea | null>(null)
  const [optimized, setOptimized] = useState<OptimizedImage | null>(null)
  const [form, setForm] = useState({ title: '', notes: '', source_url: '', is_favorite: false })

  useEffect(() => {
    if (!id) return
    supabase.from('ideas').select('*').eq('id', id).single().then(({ data, error: loadError }) => {
      if (loadError || !data) setError('Идея не найдена')
      else {
        const idea = data as Idea
        setExisting(idea)
        setForm({ title: idea.title, notes: idea.notes || '', source_url: idea.source_url || '', is_favorite: idea.is_favorite })
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
    if (!form.title.trim()) return setError('Введите название идеи')
    if (!isEdit && !optimized) return setError('Добавьте фотографию')

    setBusy(true)
    setError('')
    setProgress(25)
    let imagePath = existing?.image_path || ''

    try {
      if (optimized) {
        setProgress(55)
        imagePath = await uploadBlob(user.id, 'ideas', optimized.blob, optimized.extension)
        setProgress(78)
      }

      const sourceUrl = form.source_url.trim()
      if (sourceUrl) {
        try { new URL(sourceUrl) } catch { throw new Error('Ссылка должна начинаться с http:// или https://') }
      }

      const payload = {
        user_id: user.id,
        image_path: imagePath,
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        source_url: sourceUrl || null,
        is_favorite: form.is_favorite
      }

      if (isEdit && id) {
        const { error: updateError } = await supabase.from('ideas').update(payload).eq('id', id)
        if (updateError) throw updateError
        if (optimized && existing?.image_path && existing.image_path !== imagePath) await removeStorageFiles([existing.image_path])
        setProgress(100)
        navigate(`/ideas/${id}`, { replace: true })
      } else {
        const { data, error: insertError } = await supabase.from('ideas').insert(payload).select('id').single()
        if (insertError) throw insertError
        setProgress(100)
        navigate(`/ideas/${data.id}`, { replace: true })
      }
    } catch (err) {
      if (optimized && imagePath && imagePath !== existing?.image_path) await removeStorageFiles([imagePath])
      setError(err instanceof Error ? err.message : 'Не удалось сохранить идею')
      setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="page page--form">
      <PageHeader title={isEdit ? 'Редактировать идею' : 'Новая идея'} back />
      <form className="form-stack" onSubmit={submit}>
        <ImagePicker previewUrl={optimized?.previewUrl} currentImagePath={existing?.image_path} onSelect={selectImage} label="Добавить референс" />
        <label className="field"><span>Название *</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Например: Образ с бирюзовым акцентом" /></label>
        <label className="field"><span>Заметка</span><textarea rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Что именно понравилось и как повторить…" /></label>
        <label className="field"><span>Ссылка</span><input type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://…" /></label>
        <label className="switch-row"><input type="checkbox" checked={form.is_favorite} onChange={(e) => setForm({ ...form, is_favorite: e.target.checked })} /><span><b>Любимое</b><small>Отметить идею сердцем</small></span></label>
        {error && <div className="error-box">{error}</div>}
        {progress > 0 && <div className="upload-progress"><div style={{ width: `${progress}%` }} /><span>{progress < 100 ? 'Сохраняю…' : 'Готово'}</span></div>}
        <button className="button button--primary button--full form-submit" disabled={busy}>{busy ? 'Сохраняю…' : 'Сохранить идею'}</button>
      </form>
    </div>
  )
}
