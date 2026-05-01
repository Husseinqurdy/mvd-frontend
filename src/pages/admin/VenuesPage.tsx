// ─── VenuesPage ───────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { Venue, Building } from '../../types'
import styles from './AdminPage.module.css'

export default function VenuesPage() {
  const { data: venues } = useQuery<{ results: Venue[] }>({
    queryKey: ['venues'],
    queryFn: () => api.get('/venues/').then(r => r.data),
  })
  const { data: buildings } = useQuery<{ results: Building[] }>({
    queryKey: ['buildings'],
    queryFn: () => api.get('/venues/buildings/').then(r => r.data),
  })


  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Venues</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Buildings ({buildings?.results?.length ?? 0})</h2>
        <div className={styles.venueGrid}>
          {buildings?.results?.map(b => (
            <div key={b.id} className={`card ${styles.venueRow}`}>
              <div className={styles.venueLeft}>
                <span className={styles.venueCode}>{b.code}</span>
                <span className={styles.venueName}>{b.name}</span>
                <span className={styles.venueBuilding}>{b.location}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{b.venue_count} venues</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>All Venues ({venues?.results?.length ?? 0})</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>Building</th>
                <th>Type</th><th>Capacity</th><th>Floor</th><th>Projector</th>
              </tr>
            </thead>
            <tbody>
              {venues?.results?.map(v => (
                <tr key={v.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.code}</span></td>
                  <td>{v.name}</td>
                  <td>{v.building_name}</td>
                  <td><span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>{v.venue_type_display}</span></td>
                  <td>{v.capacity}</td>
                  <td>{v.floor}</td>
                  <td>{v.has_projector ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
