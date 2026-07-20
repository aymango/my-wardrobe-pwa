import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Outfit } from '../lib/types'
import { OutfitCard } from '../components/OutfitCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { PageHeader } from '../components/PageHeader'

export function OutfitsPage() {
  const [items, setItems] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('outfits').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems((data || []) as Outfit[])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div className="page">
      <PageHeader title="Образы" action={<Link className="header-link" to="/outfits/builder">＋ Новый</Link>} />
      {items.length ? (
        <div className="outfit-grid outfit-grid--page">{items.map((item) => <OutfitCard key={item.id} outfit={item} />)}</div>
      ) : (
        <EmptyState icon="✨" title="Пока нет образов" text="Соберите первый образ из вещей вашего шкафа." action={<Link className="button button--primary" to="/outfits/builder">Создать образ</Link>} />
      )}
    </div>
  )
}
