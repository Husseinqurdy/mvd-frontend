import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useAuth } from '../../store/auth'

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface MySession {
  id: number; course_code: string; course_name: string
  day_of_week: number; day_display: string
  start_time: string; end_time: string
  venue_code: string; venue_name: string; building: string
  program_name: string; year: number; group: string
  lecturer_name: string
}

export default function LecturerSchedule() {
  const { user } = useAuth()
  const today    = new Date().getDay() || 7  // isoWeekday

  const { data: sessions = [], isLoading } = useQuery<MySession[]>({
    queryKey: ['my-sessions', user?.user_id],
    queryFn:  () => api.get('/timetable/lecturer/my-sessions/').then(r => r.data),
    enabled:  !!user,
  })

  const todaySessions = sessions.filter(s => s.day_of_week === today)
  const byDay = DAYS.slice(1).map((day, i) => ({
    day, num: i + 1,
    sessions: sessions.filter(s => s.day_of_week === i + 1),
  })).filter(g => g.sessions.length > 0)

  const totalHours = sessions.reduce((acc, s) => {
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    return acc + (eh * 60 + em - sh * 60 - sm) / 60
  }, 0)

  return (
    <div style={{ padding: '26px 30px', maxWidth: 1000 }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--g900)' }}>My Teaching Schedule</h1>
        <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
          {user?.full_name} {user?.department ? `· ${user.department}` : ''}
        </p>
      </div>

      {/* Stats */}
      {!isLoading && sessions.length > 0 && (
        <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            ['Total Sessions', sessions.length, 'var(--brand)', '📚'],
            ['Teaching Days', byDay.length, 'var(--ok)', '📅'],
            ['Weekly Hours', totalHours.toFixed(1) + 'h', 'var(--warn)', '⏱'],
          ].map(([l, v, c, icon]) => (
            <div key={String(l)} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 11, color: 'var(--g400)' }}>{l}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: String(c) }} className="animate-count">{v}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--g400)' }}>
          <div style={{ fontSize: 24, marginBottom: 8, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
          <div>Loading your sessions…</div>
        </div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="card animate-fade-up" style={{ padding: 40, textAlign: 'center', color: 'var(--g400)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--g600)' }}>No sessions found</div>
          <div style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
            Your name (<strong>{user?.full_name}</strong>) was not matched in the active timetable.<br />
            Ask admin to ensure your name is correctly entered in the system.
          </div>
        </div>
      )}

      {/* Today highlight */}
      {todaySessions.length > 0 && (
        <div className="animate-fade-up delay-2" style={{
          background: 'var(--brand-light)', border: '1px solid #bfdbfe',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" />Today — {DAYS[today]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todaySessions.map((s, i) => {
              const [sh, sm] = s.start_time.split(':').map(Number)
              const [eh, em] = s.end_time.split(':').map(Number)
              const mins = eh * 60 + em - sh * 60 - sm
              return (
                <div key={s.id} className={`animate-fade-up delay-${Math.min(i + 1, 5)}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', padding: '12px 16px', borderRadius: 9, boxShadow: 'var(--shadow)' }}>
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand)', fontWeight: 700 }}>
                      {s.start_time}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--g400)' }}>to {s.end_time}</div>
                    <div style={{ fontSize: 10, color: 'var(--g400)', marginTop: 1 }}>{mins}min</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.course_code} — {s.course_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 2 }}>
                      {s.program_name}{s.year ? ` · Year ${s.year}` : ''}{s.group ? ` · ${s.group}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className="chip">{s.venue_code}</span>
                    <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 3 }}>{s.building}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full week by day */}
      {byDay.map((g, gi) => (
        <div key={g.day} className={`animate-fade-up delay-${Math.min(gi + 2, 5)}`} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: g.num === today ? 'var(--brand)' : 'var(--g600)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {g.day}
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--g200)' }} />
            <div style={{ fontSize: 12, color: 'var(--g400)' }}>{g.sessions.length} session{g.sessions.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead><tr><th>Time</th><th>Duration</th><th>Course</th><th>Venue</th><th>Program</th></tr></thead>
              <tbody>
                {g.sessions.map(s => {
                  const [sh, sm] = s.start_time.split(':').map(Number)
                  const [eh, em] = s.end_time.split(':').map(Number)
                  const mins = eh * 60 + em - sh * 60 - sm
                  return (
                    <tr key={s.id} style={{ background: s.day_of_week === today ? 'rgba(26,86,219,.04)' : undefined }}>
                      <td className="mono">{s.start_time}–{s.end_time}</td>
                      <td style={{ fontSize: 12, color: 'var(--g400)' }}>{mins}min</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.course_code}{s.group ? ` · ${s.group}` : ''}</div>
                        <div style={{ fontSize: 12, color: 'var(--g400)' }}>{s.course_name}</div>
                      </td>
                      <td>
                        <span className="chip">{s.venue_code}</span>
                        <span style={{ fontSize: 12, color: 'var(--g400)', marginLeft: 6 }}>{s.building}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--g500)' }}>
                        {s.program_name || '—'}{s.year ? ` · Y${s.year}` : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
