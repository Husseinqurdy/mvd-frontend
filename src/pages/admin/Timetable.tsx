import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { TimetableSession, AcademicPeriod } from '../../types'
import s from './admin.module.css'

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TimetablePage() {
  const [periodId, setPeriodId] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [search, setSearch]     = useState('')

  const { data: periods = [] } = useQuery<AcademicPeriod[]>({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results ?? r.data),
  })

  const activePeriod = periods.find(p => p.is_active)
  const pid = periodId || (activePeriod?.id?.toString() ?? '')

  const { data: sessions = [], isLoading } = useQuery<TimetableSession[]>({
    queryKey: ['sessions', pid],
    queryFn: () => api.get(`/timetable/sessions/?period=${pid}&ordering=day_of_week,start_time`).then(r => r.data.results ?? r.data),
    enabled: !!pid,
  })

  const filtered = sessions.filter(s => {
    if (dayFilter && s.day_of_week !== Number(dayFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.course_code.toLowerCase().includes(q) ||
        s.course_name.toLowerCase().includes(q) ||
        s.venue_code.toLowerCase().includes(q) ||
        (s.lecturer_name || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const grouped = DAYS.slice(1).map((day, i) => ({
    day, num: i + 1,
    sessions: filtered.filter(s => s.day_of_week === i + 1),
  })).filter(g => !dayFilter ? g.sessions.length > 0 : g.num === Number(dayFilter))

  const totalSessions = sessions.length

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Timetable</h1>
          {activePeriod && (
            <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
              Active: <strong style={{ color: 'var(--ok)' }}>{activePeriod.name}</strong>
              {totalSessions > 0 && ` · ${totalSessions} sessions`}
            </p>
          )}
        </div>
        <Link to="/dashboard/timetable/import" className="btn btn-primary">⬆ Import PDF / Excel</Link>
      </div>

      {/* Filters */}
      <div className="animate-fade-up delay-1" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 220 }} value={pid} onChange={e => setPeriodId(e.target.value)}>
          <option value="">Select period…</option>
          {periods.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}{p.is_active ? ' ✓ Active' : ''}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 150 }} value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
          <option value="">All days</option>
          {DAYS.slice(1).map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
        </select>
        <input className="input" style={{ flex: 1, minWidth: 200 }}
          placeholder="🔍  Search course, venue, lecturer…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {!pid && (
        <div className="card animate-fade-up delay-2" style={{ padding: 60, textAlign: 'center', color: 'var(--g400)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Select an academic period</div>
          <div style={{ fontSize: 13 }}>
            Don't have one? <Link to="/dashboard/academic-years" style={{ color: 'var(--brand)' }}>Create an academic period →</Link>
          </div>
        </div>
      )}

      {pid && isLoading && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--g400)' }}>Loading sessions…</div>
      )}

      {pid && !isLoading && sessions.length === 0 && (
        <div className="card animate-fade-up" style={{ padding: 60, textAlign: 'center', color: 'var(--g400)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>No sessions found</div>
          <Link to="/dashboard/timetable/import" style={{ color: 'var(--brand)', fontSize: 13 }}>
            Import a timetable PDF or Excel →
          </Link>
        </div>
      )}

      {pid && !isLoading && grouped.map((g, gi) => (
        <div key={g.day} className={`${s.section} animate-fade-up delay-${Math.min(gi + 2, 5)}`}>
          <div className={s.secTitle}>
            <span>{g.day}</span>
            <span style={{ color: 'var(--g300)', fontWeight: 400 }}>—</span>
            <span>{g.sessions.length} session{g.sessions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead><tr>
                <th>Time</th><th>Course</th><th>Course Name</th><th>Venue</th><th>Lecturer</th><th>Program</th>
              </tr></thead>
              <tbody>
                {g.sessions.map((sess, i) => (
                  <tr key={sess.id} className={`animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}>
                    <td className="mono">{sess.start_time.slice(0,5)}–{sess.end_time.slice(0,5)}</td>
                    <td>
                      <span className="chip">{sess.course_code}</span>
                      {sess.group && <span style={{ fontSize: 11, color: 'var(--g400)', marginLeft: 5 }}>{sess.group}</span>}
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>{sess.course_name}</td>
                    <td>
                      <span className="chip">{sess.venue_code}</span>
                      <span style={{ fontSize: 12, color: 'var(--g400)', marginLeft: 5 }}>{sess.venue_name}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{sess.lecturer_name || <span style={{ color: 'var(--g300)' }}>—</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--g500)' }}>{sess.program_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
