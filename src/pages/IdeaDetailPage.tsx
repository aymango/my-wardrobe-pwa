import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Idea } from '../lib/types'
import { removeStorageFiles } from '../lib/storage'
import { PageHeader } from '../components/PageHeader'
import { StorageImage } from '../components/StorageImage'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function IdeaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('ideas').select('*').eq('id', id).single().then(({ data }) => {
      setIdea(data as Idea | null)
      setLoading(false)
    })
  }, [id])

  async function toggleFavorite() {
    if (!id || !idea) return
    setBusy(true)
    const nextValue = !idea.is_favorite
    const { error: updateError } = await supabase.from('ideas').update({ is_favorite: nextValue }).eq('id', id)
    if (updateError) setError(updateError.message)
    else setIdea({ ...idea, is_favorite: nextValue })
    setBusy(false)
  }

  async function remove() {
    if (!id || !idea) return
    setBusy(true)
    const { error: deleteError } = await supabase.from('ideas').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      setBusy(false)
      return
    }
    await removeStorageFiles([idea.image_path])
    navigate('/ideas', { replace: true })
  }

  if (loading) return <LoadingScreen />
  if (!idea) return <div className="page"><PageHeader title="Идея" back /><p className="muted">Идея не найдена.</p></div>

  return (
    <div className="page detail-page">
      <PageHeader title={idea.title} back action={<button className="icon-button" onClick={toggleFavorite}>{idea.is_favorite ? '♥' : '♡'}</button>} />
      <div className="idea-detail-image"><StorageImage path={idea.image_path} alt={idea.title} className="detail-image" objectFit="contain" /></div>
      <div className="detail-content">
        <h2>{idea.title}</h2>
        {idea.notes && <div className="comment-block"><span>Заметка</span><p>{idea.notes}</p></div>}
        {idea.source_url && <a className="source-link" href={idea.source_url} target="_blank" rel="noreferrer">Открыть источник ↗</a>}
        {error && <div className="error-box">{error}</div>}
        <div className="action-grid">
          <button className="button button--primary" onClick={() => navigate(`/ideas/${idea.id}/edit`)}>Редактировать</button>
          <button className="button button--secondary" onClick={toggleFavorite} disabled={busy}>{idea.is_favorite ? 'Убрать из любимых' : 'В любимые'}</button>
          <button className="button button--danger-ghost" onClick={() => setDeleteOpen(true)}>Удалить</button>
        </div>
      </div>
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={remove} busy={busy} title="Удалить идею?" text="Фотография и заметка будут удалены без возможности восстановления." />
    </div>
  )
}
