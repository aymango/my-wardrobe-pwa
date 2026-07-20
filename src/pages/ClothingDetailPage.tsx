import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Clothing } from '../lib/types'
import { todayISO, formatDate } from '../lib/date'
import { removeStorageFiles } from '../lib/storage'
import { PageHeader } from '../components/PageHeader'
import { StorageImage } from '../components/StorageImage'
import { CategoryTag } from '../components/CategoryTag'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function ClothingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<Clothing | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('clothes').select('*').eq('id', id).single().then(({ data }) => {
      setItem(data as Clothing | null)
      setLoading(false)
    })
  }, [id])

  async function wornToday() {
    if (!id || !item) return
    setBusy(true)
    const date = todayISO()
    const { error: updateError } = await supabase.from('clothes').update({ last_worn_date: date }).eq('id', id)
    if (updateError) setError(updateError.message)
    else setItem({ ...item, last_worn_date: date })
    setBusy(false)
  }

  async function remove() {
    if (!id || !item) return
    setBusy(true)
    const { error: deleteError } = await supabase.from('clothes').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      setBusy(false)
      return
    }
    await removeStorageFiles([item.image_path])
    navigate('/wardrobe', { replace: true })
  }

  if (loading) return <LoadingScreen />
  if (!item) return <div className="page"><PageHeader title="Вещь" back /><p className="muted">Вещь не найдена.</p></div>

  return (
    <div className="page detail-page">
      <PageHeader title={item.subcategory || item.category} back action={<button className="icon-button" onClick={() => navigate(`/clothes/${item.id}/edit`)}>✎</button>} />
      <div className="detail-image-card"><StorageImage path={item.image_path} alt={item.subcategory || item.category} className="detail-image" objectFit="contain" /></div>
      <div className="detail-content">
        <CategoryTag category={item.category} label={item.subcategory || item.category} />
        <div className="detail-list">
          <div><span>Категория</span><b>{item.category}</b></div>
          <div><span>Подкатегория</span><b>{item.subcategory || 'Не выбрана'}</b></div>
          <div><span>Цвет</span><b>{item.colors.join(', ') || 'Не указан'}</b></div>
          <div><span>Сезон</span><b>{item.seasons.join(', ') || 'Не указан'}</b></div>
          <div><span>Стиль</span><b>{item.style || 'Не указан'}</b></div>
          <div><span>Последняя носка</span><b>{formatDate(item.last_worn_date)}</b></div>
        </div>
        {item.notes && <div className="note-card"><span>Заметки</span><p>{item.notes}</p></div>}
        {error && <div className="error-box">{error}</div>}
        <div className="action-stack">
          <button className="button button--primary button--full" onClick={wornToday} disabled={busy}>✓ Надевала сегодня</button>
          <button className="button button--secondary button--full" onClick={() => navigate(`/outfits/builder?item=${item.id}`)}>✨ Добавить в образ</button>
          <button className="button button--secondary button--full" onClick={() => navigate(`/clothes/${item.id}/edit`)}>Редактировать</button>
          <button className="button button--danger-ghost button--full" onClick={() => setDeleteOpen(true)}>Удалить</button>
        </div>
      </div>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={remove} busy={busy} title="Удалить вещь?" text="Фотография и данные вещи будут удалены без возможности восстановления." />
    </div>
  )
}
