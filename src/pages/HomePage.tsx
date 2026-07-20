import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Clothing, Outfit } from '../lib/types'
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_COLORS } from '../lib/constants'
import { ClothingCard } from '../components/ClothingCard'
import { OutfitCard } from '../components/OutfitCard'
import { LoadingScreen } from '../components/LoadingScreen'

export function HomePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [favorites, setFavorites] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('clothes').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('outfits').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('outfits').select('*').eq('is_favorite', true).order('updated_at', { ascending: false }).limit(4)
    ]).then(([clothesResult, outfitsResult, favoriteResult]) => {
      setClothes((clothesResult.data || []) as Clothing[])
      setOutfits((outfitsResult.data || []) as Outfit[])
      setFavorites((favoriteResult.data || []) as Outfit[])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div className="page home-page">
      <div className="home-topbar">
        <div>
          <span className="eyebrow">Личный стиль</span>
          <h1>Мой гардероб</h1>
        </div>
        <button className="icon-button" onClick={() => signOut()} aria-label="Выйти">↪</button>
      </div>

      <button className="hero-add" onClick={() => navigate('/clothes/new')}>
        <span className="hero-add__icon">＋</span>
        <span><b>Добавить вещь</b><small>Загрузить фото и заполнить детали</small></span>
        <span>→</span>
      </button>

      <section className="section-block">
        <div className="section-heading"><h2>Быстрый переход</h2></div>
        <div className="category-scroll">
          {Object.keys(CATEGORIES).map((category) => (
            <Link key={category} to={`/wardrobe?category=${encodeURIComponent(category)}`} className="category-tile" style={{ backgroundColor: CATEGORY_COLORS[category] }}>
              <span>{CATEGORY_EMOJI[category]}</span>
              <b>{category}</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>Последние вещи</h2><Link to="/wardrobe">Все</Link></div>
        {clothes.length ? <div className="product-grid product-grid--compact">{clothes.map((item) => <ClothingCard key={item.id} item={item} />)}</div> : <p className="muted">Пока нет вещей. Добавьте первую 👚</p>}
      </section>

      <section className="section-block">
        <div className="section-heading"><h2>Последние образы</h2><Link to="/outfits">Все</Link></div>
        {outfits.length ? <div className="outfit-grid">{outfits.map((outfit) => <OutfitCard key={outfit.id} outfit={outfit} />)}</div> : <p className="muted">Сохранённых образов пока нет.</p>}
      </section>

      {favorites.length > 0 && (
        <section className="section-block">
          <div className="section-heading"><h2>Любимые ♥</h2></div>
          <div className="outfit-grid">{favorites.map((outfit) => <OutfitCard key={outfit.id} outfit={outfit} />)}</div>
        </section>
      )}
    </div>
  )
}
