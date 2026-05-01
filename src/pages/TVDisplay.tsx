import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import s from './TVDisplay.module.css'

interface TodaySession {
  session_id: number | string
  type: string
  course_code: string; course_name: string
  lecturer: string; program: string
  year: number | string; group: string
  start_time: string; end_time: string
  venue_code: string; venue_name: string
  building: string; capacity: number
  cancelled: boolean; is_now: boolean; is_upcoming: boolean
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <div className={s.clock}>
      <div className={s.clockTime}>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      <div className={s.clockDate}>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
  )
}

function SessionCard({ sess }: { sess: TodaySession }) {
  const isRequest = sess.type === 'REQUEST'
  const [sh, sm] = sess.start_time.split(':').map(Number)
  const [eh, em] = sess.end_time.split(':').map(Number)
  const mins = eh * 60 + em - sh * 60 - sm

  return (
    <div className={`${s.card} ${sess.cancelled ? s.cancelled : sess.is_now ? s.active : s.upcoming}`}>
      {sess.cancelled  && <div className={s.cancelBadge}>● CANCELLED — VENUE FREE</div>}
      {sess.is_now && !sess.cancelled && <div className={s.nowBadge}>● IN PROGRESS</div>}
      {isRequest && !sess.cancelled && !sess.is_now && <div className={s.requestBadge}>📋 BOOKING</div>}

      <div className={s.cardHead}>
        <span className={s.time}>{sess.start_time}–{sess.end_time}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={s.duration}>{mins}min</span>
          <span className={s.vcode}>{sess.venue_code}</span>
        </div>
      </div>

      <div className={s.courseName}>{sess.course_name || '(No Title)'}</div>
      <div className={s.courseMeta}>
        {sess.course_code && <span className={s.courseCode}>{sess.course_code}</span>}
        {sess.group && <span className={s.group}>{sess.group}</span>}
        {isRequest && <span className={s.requestTag}>Booking</span>}
      </div>

      <div className={s.venueRow}>
        <span className={s.vname}>{sess.venue_name}</span>
        <span className={s.vbuild}>{sess.building}</span>
      </div>

      <div className={s.lecturerRow}>
        <span>👤 {sess.lecturer}</span>
        {sess.program && <span className={s.program}>{sess.program}{sess.year ? ` · Y${sess.year}` : ''}</span>}
      </div>
    </div>
  )
}

export default function TVDisplay() {
  const logoUrl = localStorage.getItem('institution_logo')

  const { data = [], isLoading, dataUpdatedAt } = useQuery<TodaySession[]>({
    queryKey: ['today-sessions'],
    queryFn: () => api.get('/venues/today/').then(r => r.data),
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  })

  const active    = data.filter(x => x.is_now  && !x.cancelled)
  const upcoming  = data.filter(x => x.is_upcoming && !x.cancelled)
  const cancelled = data.filter(x => x.cancelled)
  const last      = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.hLeft}>
          <div className={s.hLogo}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} />
              : <span>M</span>
            }
          </div>
          <div>
            <div className={s.hTitle}>MUST — Today's Schedule</div>
            <div className={s.hSub}>Mbeya University of Science and Technology</div>
          </div>
        </div>
        <div className={s.stats}>
          <div className={s.stat}>
            <span style={{ color: '#4ade80', fontSize: 26, fontWeight: 800 }}>{active.length}</span>
            <span className={s.statL}>In Progress</span>
          </div>
          <div className={s.div} />
          <div className={s.stat}>
            <span style={{ color: '#93c5fd', fontSize: 26, fontWeight: 800 }}>{upcoming.length}</span>
            <span className={s.statL}>Upcoming</span>
          </div>
          <div className={s.div} />
          <div className={s.stat}>
            <span style={{ color: '#f87171', fontSize: 26, fontWeight: 800 }}>{cancelled.length}</span>
            <span className={s.statL}>Cancelled</span>
          </div>
        </div>
        <Clock />
      </header>

      {isLoading && (
        <div className={s.loading}>
          <div className={s.spinner} />
          Loading today's sessions…
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className={s.empty}>
          <div style={{ fontSize: 64, marginBottom: 20, opacity: .3 }}>📅</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No sessions today</div>
          <div style={{ fontSize: 14, opacity: .5 }}>Check back during teaching hours</div>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <div className={s.body}>
          {active.length > 0 && (
            <section>
              <div className={s.secLabel}>
                <span className={s.secDot} style={{ background: '#4ade80' }} />
                In Progress
                <span className={s.secCount}>{active.length}</span>
              </div>
              <div className={s.grid}>{active.map(x => <SessionCard key={String(x.session_id)} sess={x} />)}</div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <div className={s.secLabel}>
                <span className={s.secDot} style={{ background: '#93c5fd' }} />
                Upcoming Today
                <span className={s.secCount}>{upcoming.length}</span>
              </div>
              <div className={s.grid}>{upcoming.map(x => <SessionCard key={String(x.session_id)} sess={x} />)}</div>
            </section>
          )}
          {cancelled.length > 0 && (
            <section>
              <div className={s.secLabel}>
                <span className={s.secDot} style={{ background: '#f87171' }} />
                Cancelled — Venue Available
                <span className={s.secCount}>{cancelled.length}</span>
              </div>
              <div className={s.grid}>{cancelled.map(x => <SessionCard key={String(x.session_id)} sess={x} />)}</div>
            </section>
          )}
        </div>
      )}

      <footer className={s.footer}>
        <span>Auto-refreshes every 60 seconds</span>
        <span className={s.footDot}>·</span>
        <span>Last updated: {last}</span>
        <span className={s.footDot}>·</span>
        <span>MUST Venue Display System</span>
      </footer>
    </div>
  )
}
