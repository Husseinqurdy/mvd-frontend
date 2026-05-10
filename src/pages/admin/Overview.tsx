import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { VenueStatus, VenueRequest } from '../../types'
import s from './admin.module.css'

export default function Overview() {
  const { data: statuses = [] } = useQuery<VenueStatus[]>({
    queryKey: ['statuses'],
    queryFn: () => api.get('/venues/status/').then(r => r.data),
    refetchInterval: 30000,   // refresh every 30s to reflect new bookings
  })
  const { data: pending = [] } = useQuery<VenueRequest[]>({
    queryKey: ['pending-requests'],
    queryFn: () => api.get('/requests/?status=PENDING').then(r => r.data.results ?? r.data),
    refetchInterval: 30000,
  })

  const occ   = statuses.filter(v => v.status === 'OCCUPIED').length
  const avail = statuses.filter(v => v.status === 'AVAILABLE').length

  const stats = [
    { label: 'Total Venues',     val: statuses.length, color: 'var(--g800)', icon: '🏛' },
    { label: 'Occupied Now',     val: occ,             color: 'var(--bad)',  icon: '🔴' },
    { label: 'Available Now',    val: avail,           color: 'var(--ok)',   icon: '🟢' },
    { label: 'Pending Requests', val: pending.length,  color: 'var(--warn)', icon: '📋' },
  ]

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>Real-time venue status across campus</p>
        </div>
        <span className="badge badge-ok"><span className="live-dot" style={{ marginRight: 4 }} />Live</span>
      </div>

      <div className={s.stats4}>
        {stats.map((x, i) => (
          <div key={x.label} className={`card animate-fade-up delay-${i + 1}`} style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{x.icon}</span>
              <span style={{ fontSize: 11, color: 'var(--g400)', background: 'var(--g100)', padding: '2px 7px', borderRadius: 4 }}>
                {x.label}
              </span>
            </div>
            <div style={{ fontSize: 38, fontWeight: 700, color: x.color, lineHeight: 1 }} className="animate-count">{x.val}</div>
          </div>
        ))}
      </div>

      <div className={s.section + ' animate-fade-up delay-3'}>
        <h2 className={s.secTitle}>Live Venue Status</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statuses.map((v, i) => (
            <div key={v.venue_id}
              className={`card animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 12,
                borderLeft: `3px solid ${v.status === 'OCCUPIED' ? 'var(--bad)' : 'var(--ok)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span className="chip">{v.venue_code}</span>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{v.venue_name}</span>
                <span style={{ fontSize: 12, color: 'var(--g400)' }}>{v.building}</span>
                <span style={{ fontSize: 11, color: 'var(--g300)', background: 'var(--g100)', padding: '1px 6px', borderRadius: 4 }}>
                  Cap. {v.capacity}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {v.current_session && (
                  <span style={{ fontSize: 12, color: 'var(--g500)', fontFamily: 'var(--font-mono)' }}>
                    {v.current_session.course_code} · {v.current_session.start_time}–{v.current_session.end_time}
                  </span>
                )}
                <span className={`badge ${v.status === 'OCCUPIED' ? 'badge-bad' : 'badge-ok'}`}>
                  {v.status === 'OCCUPIED' ? '● OCCUPIED' : '● AVAILABLE'}
                </span>
              </div>
            </div>
          ))}
          {!statuses.length && (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--g400)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏛</div>
              <div>No venues found. Import a timetable PDF first.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
