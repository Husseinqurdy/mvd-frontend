import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import styles from './DashboardLayout.module.css'

const ADMIN_NAV = [
  { to: '/dashboard',           icon: '▦', label: 'Overview' },
  { to: '/dashboard/venues',    icon: '🏛', label: 'Venues' },
  { to: '/dashboard/timetable', icon: '📅', label: 'Timetable' },
  { to: '/dashboard/requests',  icon: '📋', label: 'Requests' },
  { to: '/dashboard/users',     icon: '👥', label: 'Users' },
]

const CR_NAV = [
  { to: '/cr', icon: '🏛', label: 'My Requests' },
]

const LECTURER_NAV = [
  { to: '/lecturer', icon: '📅', label: 'My Schedule' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'ADMIN'     ? ADMIN_NAV :
    user?.role === 'CLASS_REP' ? CR_NAV    : LECTURER_NAV

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>M</span>
          <div>
            <div className={styles.logoText}>MUST</div>
            <div className={styles.logoSub}>Venue Display</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/cr' || item.to === '/lecturer'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.full_name?.charAt(0) ?? '?'}
            </div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{user?.full_name}</div>
              <div className={styles.userRole}>{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            ⎋
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
