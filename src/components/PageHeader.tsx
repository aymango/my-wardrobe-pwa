import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PageHeader({ title, back = false, action }: { title: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="page-header">
      <div className="page-header__side">
        {back && <button className="icon-button" onClick={() => navigate(-1)} aria-label="Назад">←</button>}
      </div>
      <h1>{title}</h1>
      <div className="page-header__side page-header__side--right">{action}</div>
    </header>
  )
}
