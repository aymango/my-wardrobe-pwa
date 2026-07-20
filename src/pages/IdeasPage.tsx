import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Idea } from '../lib/types'
import { IdeaCard } from '../components/IdeaCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { PageHeader } from '../components/PageHeader'

export function IdeasPage() {
  const [items, setItems] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('ideas').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems((data || []) as Idea[])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div className="page">
      <PageHeader title="Идеи" action={<Link className="header-link" to="/ideas/new">＋ Добавить</Link>} />
      {items.length ? (
        <div className="ideas-masonry">{items.map((item) => <IdeaCard key={item.id} idea={item} />)}</div>
      ) : (
        <EmptyState icon="💡" title="Пока нет идей" text="Сохраняйте фотографии, ссылки и заметки для вдохновения." action={<Link className="button button--primary" to="/ideas/new">Добавить идею</Link>} />
      )}
    </div>
  )
}
