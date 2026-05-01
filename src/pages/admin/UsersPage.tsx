import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { User } from '../../types'
import styles from './AdminPage.module.css'

const roleColors: Record<string, string> = {
  ADMIN: '#1a56db', CLASS_REP: '#d97706', LECTURER: '#16a34a'
}

export default function UsersPage() {
  const { data } = useQuery<{ results: User[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/accounts/users/').then(r => r.data),
  })

  const users = data?.results ?? []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Users ({users.length})</h1>
      </div>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.email}</td>
                <td>
                  <span className="badge" style={{
                    background: roleColors[u.role] + '18',
                    color: roleColors[u.role],
                  }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td>{u.department || '—'}</td>
                <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  {new Date(u.date_joined).toLocaleDateString('en-GB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
