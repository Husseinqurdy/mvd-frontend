import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { TimetableSession } from '../../types'
import { useAuthStore } from '../../store/authStore'
import styles from './LecturerPage.module.css'

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function LecturerPage() {
  const { user } = useAuthStore()

  const { data } = useQuery<{ results: TimetableSession[] }>({
    queryKey: ['my-sessions'],
    queryFn: () => api.get('/timetable/sessions/?ordering=day_of_week,start_time').then(r => r.data),
  })

  const sessions = data?.results ?? []
  const todayNum = new Date().getDay() || 7  // Sun=0→7 for isoWeekday compat
  const todayName = DAYS[todayNum] ?? ''
  const todaySessions = sessions.filter(s => s.day_of_week === todayNum)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Teaching Schedule</h1>
        <p className={styles.subtitle}>{user?.full_name} · {user?.department}</p>
      </div>

      {/* Today highlight */}
      {todaySessions.length > 0 && (
        <div className={styles.todayBox}>
          <div className={styles.todayLabel}>Today — {todayName}</div>
          <div className={styles.todayList}>
            {todaySessions.map(s => (
              <div key={s.id} className={styles.todayItem}>
                <span className={styles.todayTime}>{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                <span className={styles.todayCourse}>{s.course_code} — {s.course_name}</span>
                <span className={styles.todayVenue}>{s.venue_code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full week table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={th}>Day</th><th style={th}>Time</th><th style={th}>Course</th>
              <th style={th}>Venue</th><th style={th}>Program / Year</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}
                style={{
                  borderBottom: '1px solid var(--gray-100)',
                  background: s.day_of_week === todayNum ? 'var(--brand-light)' : undefined
                }}
              >
                <td style={td}>{s.day_display}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {s.start_time.slice(0,5)} – {s.end_time.slice(0,5)}
                </td>
                <td style={td}>
                  <div style={{ fontWeight: 500 }}>{s.course_code}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{s.course_name}</div>
                </td>
                <td style={td}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--gray-100)', padding: '2px 7px', borderRadius: 4 }}>
                    {s.venue_code}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 6 }}>{s.building}</span>
                </td>
                <td style={{ ...td, fontSize: 13 }}>{s.program} · Year {s.year_of_study}</td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                No sessions assigned yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left', fontSize: 12, fontWeight: 600,
  color: 'var(--gray-500)', textTransform: 'uppercase',
  letterSpacing: '.04em', padding: '11px 16px',
}
const td: React.CSSProperties = { padding: '11px 16px', fontSize: 14, color: 'var(--gray-700)' }
