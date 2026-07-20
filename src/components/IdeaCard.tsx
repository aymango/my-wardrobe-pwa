import { Link } from 'react-router-dom'
import type { Idea } from '../lib/types'
import { StorageImage } from './StorageImage'

export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link to={`/ideas/${idea.id}`} className="idea-card">
      <div className="idea-card__image-wrap">
        <StorageImage path={idea.image_path} alt={idea.title} className="idea-card__image" />
        {idea.is_favorite && <span className="favorite-badge" aria-label="Любимая идея">♥</span>}
      </div>
      <div className="idea-card__body">
        <strong>{idea.title}</strong>
        {idea.notes && <p>{idea.notes}</p>}
      </div>
    </Link>
  )
}
