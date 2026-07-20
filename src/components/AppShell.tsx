import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🏠', label: 'Главная' },
  { to: '/wardrobe', icon: '👚', label: 'Шкаф' },
  { to: '/outfits', icon: '✨', label: 'Образы' },
  { to: '/ideas', icon: '💡', label: 'Идеи' }
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const hideNav = ['/login'].includes(location.pathname)
  const showFab = !hideNav && !location.pathname.includes('/new') && !location.pathname.includes('/edit') && !location.pathname.includes('/builder')

  return (
    <div className="app-shell">
      <main className="app-main"><Outlet /></main>
      {showFab && (
        <button className="add-fab" onClick={() => navigate('/clothes/new')} aria-label="Добавить вещь">
          <span>＋</span> Добавить
        </button>
      )}
      {!hideNav && (
        <nav className="bottom-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => isActive ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}>
              <span className="bottom-nav__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
