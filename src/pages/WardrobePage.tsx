import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Clothing, ClothingFilters } from '../lib/types'
import { CATEGORIES, COLORS, SEASONS } from '../lib/constants'
import { ClothingCard } from '../components/ClothingCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'

const initialFilters: ClothingFilters = {
  category: '', subcategory: '', color: '', season: '', style: '', sort: 'newest'
}

export function WardrobePage() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<ClothingFilters>({ ...initialFilters, category: searchParams.get('category') || '' })

  useEffect(() => {
    supabase.from('clothes').select('*').then(({ data }) => {
      setItems((data || []) as Clothing[])
      setLoading(false)
    })
  }, [])

  const styles = useMemo(() => Array.from(new Set(items.map((item) => item.style).filter(Boolean) as string[])).sort(), [items])
  const subcategories = filters.category ? CATEGORIES[filters.category] || [] : Object.values(CATEGORIES).flat()
  const activeCount = [filters.category, filters.subcategory, filters.color, filters.season, filters.style].filter(Boolean).length

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = items.filter((item) => {
      const haystack = [item.category, item.subcategory, item.style, item.colors.join(' '), item.seasons.join(' '), item.notes].filter(Boolean).join(' ').toLowerCase()
      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && (!filters.category || item.category === filters.category)
        && (!filters.subcategory || item.subcategory === filters.subcategory)
        && (!filters.color || item.colors.includes(filters.color))
        && (!filters.season || item.seasons.includes(filters.season))
        && (!filters.style || item.style === filters.style)
    })

    return result.sort((a, b) => {
      if (filters.sort === 'oldest') return a.created_at.localeCompare(b.created_at)
      if (filters.sort === 'last-worn-newest') return (b.last_worn_date || '').localeCompare(a.last_worn_date || '')
      if (filters.sort === 'last-worn-oldest') return (a.last_worn_date || '9999').localeCompare(b.last_worn_date || '9999')
      return b.created_at.localeCompare(a.created_at)
    })
  }, [items, filters, query])

  if (loading) return <LoadingScreen />

  return (
    <div className="page">
      <PageHeader title="Шкаф" />
      <div className="search-toolbar">
        <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти вещь" /></label>
        <button className={`filter-button ${activeCount ? 'filter-button--active' : ''}`} onClick={() => setFiltersOpen(true)}>⚙️{activeCount ? <b>{activeCount}</b> : null}</button>
      </div>
      <div className="results-row"><span>{filtered.length} вещей</span>{activeCount > 0 && <button onClick={() => setFilters(initialFilters)}>Очистить</button>}</div>

      {filtered.length ? (
        <div className="product-grid">{filtered.map((item) => <ClothingCard key={item.id} item={item} />)}</div>
      ) : (
        <EmptyState icon="👚" title="Ничего не найдено" text="Измените фильтры или добавьте новую вещь." action={<Link className="button button--primary" to="/clothes/new">Добавить вещь</Link>} />
      )}

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Фильтры" variant="sheet">
        <div className="filter-form">
          <label className="field"><span>Категория</span><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, subcategory: '' })}><option value="">Все категории</option>{Object.keys(CATEGORIES).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Подкатегория</span><select value={filters.subcategory} onChange={(e) => setFilters({ ...filters, subcategory: e.target.value })}><option value="">Все подкатегории</option>{subcategories.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Цвет</span><select value={filters.color} onChange={(e) => setFilters({ ...filters, color: e.target.value })}><option value="">Все цвета</option>{COLORS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Сезон</span><select value={filters.season} onChange={(e) => setFilters({ ...filters, season: e.target.value })}><option value="">Все сезоны</option>{SEASONS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Стиль</span><select value={filters.style} onChange={(e) => setFilters({ ...filters, style: e.target.value })}><option value="">Все стили</option>{styles.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Сортировка</span><select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as ClothingFilters['sort'] })}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="last-worn-newest">Недавно надевала</option><option value="last-worn-oldest">Давно не надевала</option></select></label>
          <div className="dialog-actions sticky-actions"><button className="button button--secondary" onClick={() => setFilters(initialFilters)}>Очистить</button><button className="button button--primary" onClick={() => setFiltersOpen(false)}>Показать {filtered.length}</button></div>
        </div>
      </Modal>
    </div>
  )
}
