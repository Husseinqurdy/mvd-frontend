import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { VenueStatus, VenueRequest } from '../../types'
import styles from './AdminPage.module.css'

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className={`card ${styles.statCard}`}>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

export default function OverviewPage() {
  const { data: statuses } = useQuery<VenueStatus[]>({
    queryKey: ['venue-statuses'],
    queryFn: () => api.get('/venues/status/').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: requests } = useQuery<{ results: VenueRequest[] }>({
    queryKey: ['requests-overview'],
    queryFn: () => api.get('/requests/?status=PENDING').then(r => r.data),
  })

  const occupied  = statuses?.filter(v => v.status === 'OCCUPIED').length  ?? 0
  const available = statuses?.filter(v => v.status === 'AVAILABLE').length ?? 0
  const total     = statuses?.length ?? 0
  const pending   = requests?.results?.length ?? 0

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Overview</h1>
        <span className={styles.liveTag}>● Live</span>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Venues"  value={total}     color="var(--gray-800)" />
        <StatCard label="Occupied Now"  value={occupied}  color="var(--occupied)"  sub="in use" />
        <StatCard label="Available Now" value={available} color="var(--available)" sub="free" />
        <StatCard label="Pending Requests" value={pending} color="var(--pending)" sub="awaiting review" />
      </div>

      {/* Live venue grid */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Live Venue Status</h2>
        <div className={styles.venueGrid}>
          {statuses?.map(v => (
            <div key={v.venue_id} className={`card ${styles.venueRow}`}>
              <div className={styles.venueLeft}>
                <span className={styles.venueCode}>{v.venue_code}</span>
                <span className={styles.venueName}>{v.venue_name}</span>
                <span className={styles.venueBuilding}>{v.building}</span>
              </div>
              <div className={styles.venueRight}>
                {v.current_session && (
                  <span className={styles.sessionChip}>
                    {v.current_session.course_code} · {v.current_session.start_time}–{v.current_session.end_time}
                  </span>
                )}
                <span className={`badge ${v.status === 'OCCUPIED' ? 'badge-occupied' : 'badge-available'}`}>
                  {v.status}
                </span>
              </div>
            </div>
          ))}
          {!statuses?.length && (
            <div className={styles.emptyHint}>No venues found. Add buildings and venues first.</div>
          )}
        </div>
      </div>
    </div>
  )
}
