import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { Venue, Building } from '../../types'
import s from './admin.module.css'

export default function VenuesPage() {
  const [search, setSearch]         = useState('')
  const [bldFilter, setBldFilter]   = useState('')
  const [view, setView]             = useState<'grid' | 'table'>('table')

  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: () => api.get('/venues/').then(r => r.data.results ?? r.data),
  })
  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: () => api.get('/venues/buildings/').then(r => r.data.results ?? r.data),
  })

  const filtered = venues.filter(v => {
    if (bldFilter && String(v.building) !== bldFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || v.building_name.toLowerCase().includes(q)
    }
    return true
  })

  const typeColors: Record<string, string> = {
    LECTURE_HALL: 'badge-ok', LABORATORY: 'badge-warn', SEMINAR_ROOM: 'badge-gray',
    TUTORIAL_ROOM: 'badge-gray', CONFERENCE_ROOM: 'badge-bad', OTHER: 'badge-gray',
  }

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Venues ({venues.length})</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
            Venues are created automatically when you import a timetable.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '7px 12px' }} onClick={() => setView('table')}>☰ Table</button>
          <button className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '7px 12px' }} onClick={() => setView('grid')}>⊞ Grid</button>
        </div>
      </div>

      {/* Buildings summary */}
      <div className="animate-fade-up delay-1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className={`btn ${!bldFilter ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 14px', fontSize: 12 }}
          onClick={() => setBldFilter('')}>All Buildings ({venues.length})</button>
        {buildings.map(b => (
          <button key={b.id}
            className={`btn ${bldFilter === String(b.id) ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => setBldFilter(bldFilter === String(b.id) ? '' : String(b.id))}>
            {b.name} <span style={{ opacity: .6 }}>({b.venue_count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="animate-fade-up delay-2" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 340 }}
          placeholder="🔍  Search venue code, name…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table view */}
      {view === 'table' && (
        <div className="card animate-fade-up delay-3" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr>
              <th>Code</th><th>Name</th><th>Building</th><th>Type</th><th>Capacity</th><th>Status</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--g400)' }}>Loading…</td></tr>}
              {!isLoading && filtered.map((v, i) => (
                <tr key={v.id} className={`animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}>
                  <td><span className="chip">{v.code}</span></td>
                  <td style={{ fontWeight: 500, fontSize: 14 }}>{v.name}</td>
                  <td style={{ color: 'var(--g500)', fontSize: 13 }}>{v.building_name}</td>
                  <td><span className={`badge ${typeColors[v.venue_type] ?? 'badge-gray'}`} style={{ fontSize: 11 }}>{v.venue_type_display}</span></td>
                  <td style={{ fontSize: 13 }}>{v.capacity || '—'}</td>
                  <td><span className={`badge ${v.is_active ? 'badge-ok' : 'badge-gray'}`}>{v.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
              {!isLoading && !filtered.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--g400)' }}>No venues found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div className="animate-fade-up delay-3"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
          {filtered.map((v, i) => (
            <div key={v.id} className={`card animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="chip">{v.code}</span>
                <span className={`badge ${v.is_active ? 'badge-ok' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                  {v.is_active ? 'Active' : 'Off'}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{v.name}</div>
              <div style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 6 }}>{v.building_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge ${typeColors[v.venue_type] ?? 'badge-gray'}`} style={{ fontSize: 10 }}>{v.venue_type_display}</span>
                {v.capacity > 0 && <span style={{ fontSize: 12, color: 'var(--g500)' }}>Cap. {v.capacity}</span>}
              </div>
            </div>
          ))}
          {!isLoading && !filtered.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--g400)' }} className="card">
              No venues found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
