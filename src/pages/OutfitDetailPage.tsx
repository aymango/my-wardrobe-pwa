import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Clothing, Outfit } from '../lib/types'
import { formatDate } from '../lib/date'
import { removeStorageFiles } from '../lib/storage'
import { StorageImage } from '../components/StorageImage'
import { ClothingCard } from '../components/ClothingCard'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function OutfitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('outfits').select('*').eq('id', id).single().then(async ({ data }) => {
      const next = data as Outfit | null
      setOutfit(next)
      const ids = next?.canvas_data?.items?.map((item) => item.clothing_id) || []
      if (ids.length) {
        const { data: clothingData } = await supabase.from('clothes').select('*').in('id', ids)
        setClothes((clothingData || []) as Clothing[])
      }
      setLoading(false)
    })
  }, [id])

  const orderedClothes = useMemo(() => {
    if (!outfit) return clothes
    const order = outfit.canvas_data.items.map((item) => item.clothing_id)
    return [...clothes].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  }, [clothes, outfit])

  async function toggleFavorite() {
    if (!id || !outfit) return
    setBusy(true)
    const nextValue = !outfit.is_favorite
    const { error: updateError } = await supabase.from('outfits').update({ is_favorite: nextValue }).eq('id', id)
    if (updateError) setError(updateError.message)
    else setOutfit({ ...outfit, is_favorite: nextValue })
    setBusy(false)
  }

  async function remove() {
    if (!id || !outfit) return
    setBusy(true)
    const { error: deleteError } = await supabase.from('outfits').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      setBusy(false)
      return
    }
    await removeStorageFiles([outfit.preview_image_path])
    navigate('/outfits', { replace: true })
  }

  if (loading) return <LoadingScreen />
  if (!outfit) return <div className="page"><PageHeader title="Образ" back /><p className="muted">Образ не найден.</p></div>

  return (
    <div className="page detail-page">
      <PageHeader title={outfit.title} back action={<button className="icon-button" onClick={toggleFavorite} aria-label="Добавить в любимые">{outfit.is_favorite ? '♥' : '♡'}</button>} />
      <div className="outfit-preview-large"><StorageImage path={outfit.preview_image_path} alt={outfit.title} className="detail-image" objectFit="contain" /></div>
      <div className="detail-content">
        <h2>{outfit.title}</h2>
        {outfit.comment && <div className="comment-block"><span>Комментарий</span><p>{outfit.comment}</p></div>}
        <div className="detail-list">
          <div><span>Дата</span><b>{formatDate(outfit.outfit_date)}</b></div>
          <div><span>Повод</span><b>{outfit.occasion || 'Не указан'}</b></div>
          <div><span>Любимый</span><b>{outfit.is_favorite ? 'Да ♥' : 'Нет'}</b></div>
        </div>
        {error && <div className="error-box">{error}</div>}
        <div className="action-grid">
          <button className="button button--primary" onClick={() => navigate(`/outfits/${outfit.id}/edit`)}>Открыть в конструкторе</button>
          <button className="button button--secondary" onClick={() => navigate(`/outfits/${outfit.id}/edit`)}>Редактировать</button>
          <button className="button button--secondary" onClick={toggleFavorite} disabled={busy}>{outfit.is_favorite ? 'Убрать из любимых' : 'В любимые'}</button>
          <button className="button button--danger-ghost" onClick={() => setDeleteOpen(true)}>Удалить</button>
        </div>
      </div>

      {orderedClothes.length > 0 && (
        <section className="section-block detail-section">
          <div className="section-heading"><h2>Использованные вещи</h2></div>
          <div className="product-grid">{orderedClothes.map((item) => <ClothingCard key={item.id} item={item} />)}</div>
        </section>
      )}

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={remove} busy={busy} title="Удалить образ?" text="Образ и его превью будут удалены без возможности восстановления." />
    </div>
  )
}
