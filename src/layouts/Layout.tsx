import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import s from './Layout.module.css'

const ADMIN_NAV = [
  { to: '/dashboard',                  icon: '◉', label: 'Overview' },
  { to: '/dashboard/users',            icon: '👥', label: 'Users' },
  { to: '/dashboard/venues',           icon: '🏛', label: 'Venues' },
  { to: '/dashboard/timetable',        icon: '📅', label: 'Timetable' },
  { to: '/dashboard/timetable/import', icon: '⬆', label: 'Import Timetable' },
  { to: '/dashboard/requests',         icon: '📋', label: 'Venue Requests' },
  { to: '/dashboard/academic-years',   icon: '🎓', label: 'Academic Years' },
]
const CR_NAV       = [{ to: '/cr',       icon: '📋', label: 'My Requests' }]
const LECTURER_NAV = [{ to: '/lecturer', icon: '📅', label: 'My Schedule' }]

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const items = user?.role === 'ADMIN' ? ADMIN_NAV : user?.role === 'CLASS_REP' ? CR_NAV : LECTURER_NAV

  // Get stored logo
  const logoUrl = localStorage.getItem('institution_logo')

  return (
    <div className={s.layout}>
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <div className={s.logoWrap}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className={s.logoImg} />
              : <span className={s.logoText}>M</span>
            }
          </div>
          <div>
            <div className={s.brandName}>MUST VDS</div>
            <div className={s.brandSub}>Venue Display System</div>
          </div>
        </div>

        <nav className={s.nav}>
          {items.map((item, i) => (
            <NavLink key={item.to} to={item.to}
              end={item.to === '/dashboard' || item.to === '/cr' || item.to === '/lecturer'}
              className={({ isActive }) => `${s.link} ${isActive ? s.active : ''} animate-slide-left delay-${Math.min(i + 1, 5)}`}>
              <span className={s.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={s.foot}>
          <div className={s.avatar}>{user?.full_name?.[0] ?? '?'}</div>
          <div className={s.userInfo}>
            <div className={s.userName}>{user?.full_name}</div>
            <div className={s.userRole}>{user?.role?.replace('_', ' ')}</div>
          </div>
          <button className={s.logoutBtn} title="Logout" onClick={() => { logout(); nav('/login') }}>⎋</button>
        </div>
      </aside>

      <main className={s.main}><Outlet /></main>
    </div>
  )
}
