import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { TimetableSession } from '../../types'
import styles from './AdminPage.module.css'

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TimetablePage() {
  const { data } = useQuery<{ results: TimetableSession[] }>({
    queryKey: ['timetable-sessions'],
    queryFn: () => api.get('/timetable/sessions/?ordering=day_of_week,start_time').then(r => r.data),
  })

  const sessions = data?.results ?? []
  const grouped = DAYS.slice(1).map(day => ({
    day,
    sessions: sessions.filter(s => DAYS[s.day_of_week] === day)
  })).filter(g => g.sessions.length > 0)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Master Timetable</h1>
      </div>

      {grouped.map(({ day, sessions: daySessions }) => (
        <div key={day} className={styles.section}>
          <h2 className={styles.sectionTitle}>{day} — {daySessions.length} sessions</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>Course</th><th>Name</th>
                  <th>Venue</th><th>Lecturer</th><th>Program</th><th>Year</th>
                </tr>
              </thead>
              <tbody>
                {daySessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.course_code}</span></td>
                    <td>{s.course_name}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.venue_code}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 6 }}>{s.venue_name}</span>
                    </td>
                    <td>{s.lecturer_name ?? '—'}</td>
                    <td>{s.program}</td>
                    <td>{s.year_of_study}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <div className={styles.emptyHint}>No timetable sessions found. Use the seed command or add sessions via Django Admin.</div>
      )}
    </div>
  )
}
