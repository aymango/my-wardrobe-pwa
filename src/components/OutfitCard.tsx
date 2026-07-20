import { Link } from 'react-router-dom'
import type { Outfit } from '../lib/types'
import { StorageImage } from './StorageImage'

export function OutfitCard({ outfit }: { outfit: Outfit }) {
  return (
    <Link to={`/outfits/${outfit.id}`} className="outfit-card">
      <div className="outfit-card__image-wrap">
        <StorageImage path={outfit.preview_image_path} alt={outfit.title} className="outfit-card__image" objectFit="contain" />
        {outfit.is_favorite && <span className="favorite-badge" aria-label="Любимый образ">♥</span>}
      </div>
      <div className="outfit-card__body">
        <strong>{outfit.title}</strong>
        {outfit.comment && <p>{outfit.comment}</p>}
      </div>
    </Link>
  )
}
