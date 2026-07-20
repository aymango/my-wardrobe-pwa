import { Link } from 'react-router-dom'
import type { Clothing } from '../lib/types'
import { CategoryTag } from './CategoryTag'
import { StorageImage } from './StorageImage'
import { formatShortDate } from '../lib/date'

export function ClothingCard({ item }: { item: Clothing }) {
  const shownColors = item.colors.slice(0, 2)
  const extraColors = item.colors.length - shownColors.length

  return (
    <Link to={`/clothes/${item.id}`} className="product-card">
      <div className="product-card__image-wrap">
        <StorageImage path={item.image_path} alt={item.subcategory || item.category} className="product-card__image" objectFit="contain" />
      </div>
      <div className="product-card__body">
        <CategoryTag category={item.category} label={item.subcategory || item.category} />
        <div className="product-card__meta">
          <span>{shownColors.join(', ') || 'Цвет не указан'}{extraColors > 0 ? ` +${extraColors}` : ''}</span>
          <span>{item.seasons.slice(0, 2).join(', ') || 'Сезон не указан'}</span>
        </div>
        {item.last_worn_date && <div className="product-card__date">Носила: {formatShortDate(item.last_worn_date)}</div>}
      </div>
    </Link>
  )
}
