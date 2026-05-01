import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { VenueStatus } from '../types'
import styles from './TVDisplayPage.module.css'

function fetchAllStatuses(): Promise<VenueStatus[]> {
  return api.get('/venues/status/').then(r => r.data)
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={styles.clock}>
      <div className={styles.clockTime}>
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className={styles.clockDate}>
        {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

function VenueCard({ v }: { v: VenueStatus }) {
  const isOccupied = v.status === 'OCCUPIED'
  return (
    <div className={`${styles.venueCard} ${isOccupied ? styles.occupied : styles.available}`}>
      <div className={styles.cardTop}>
        <div className={styles.venueCode}>{v.venue_code}</div>
        <div className={`${styles.statusPill} ${isOccupied ? styles.pillOccupied : styles.pillAvailable}`}>
          <span className={styles.dot} />
          {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
        </div>
      </div>

      <div className={styles.venueName}>{v.venue_name}</div>
      <div className={styles.venueBuilding}>{v.building} · Cap. {v.capacity}</div>

      {isOccupied && v.current_session && (
        <div className={styles.sessionBox}>
          <div className={styles.sessionCourse}>{v.current_session.course_code}</div>
          <div className={styles.sessionName}>{v.current_session.course_name}</div>
          <div className={styles.sessionMeta}>
            {v.current_session.start_time} – {v.current_session.end_time}
            {v.current_session.lecturer !== 'TBA' && ` · ${v.current_session.lecturer}`}
          </div>
        </div>
      )}

      {!isOccupied && v.next_session && (
        <div className={styles.nextBox}>
          <span className={styles.nextLabel}>Next:</span>
          {v.next_session.course_code} at {v.next_session.start_time}
        </div>
      )}

      {!isOccupied && !v.next_session && (
        <div className={styles.freeAll}>Free all day</div>
      )}
    </div>
  )
}

export default function TVDisplayPage() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['tv-status'],
    queryFn: fetchAllStatuses,
    refetchInterval: 60_000,   // auto-refresh every 60 seconds
    refetchIntervalInBackground: true,
  })

  const occupied  = data?.filter(v => v.status === 'OCCUPIED').length ?? 0
  const available = data?.filter(v => v.status === 'AVAILABLE').length ?? 0
  const lastSync  = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

  return (
    <div className={styles.page}>
      {/* Header bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>M</div>
          <div>
            <div className={styles.headerTitle}>MUST Venue Display System</div>
            <div className={styles.headerSub}>Mbeya University of Science and Technology</div>
          </div>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: 'var(--occupied)' }}>{occupied}</span>
            <span className={styles.statLabel}>Occupied</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: 'var(--available)' }}>{available}</span>
            <span className={styles.statLabel}>Available</span>
          </div>
        </div>

        <Clock />
      </header>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.loading}>Loading venue statuses…</div>
      ) : (
        <div className={styles.grid}>
          {data?.map(v => <VenueCard key={v.venue_id} v={v} />)}
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        Auto-refreshes every 60 seconds · Last updated: {lastSync}
      </footer>
    </div>
  )
}
