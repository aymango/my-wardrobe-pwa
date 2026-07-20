import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return <div className="page"><EmptyState icon="🧭" title="Страница не найдена" text="Вернитесь на главную страницу приложения." action={<Link className="button button--primary" to="/">На главную</Link>} /></div>
}
