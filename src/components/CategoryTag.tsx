import { CATEGORY_COLORS } from '../lib/constants'

export function CategoryTag({ category, label }: { category: string; label?: string | null }) {
  return (
    <span className="category-tag" style={{ backgroundColor: CATEGORY_COLORS[category] || '#E8F7F5' }}>
      {label || category}
    </span>
  )
}
