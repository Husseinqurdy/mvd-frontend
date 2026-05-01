import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { VenueRequest, Venue } from '../../types'
import { useAuthStore } from '../../store/authStore'
import styles from './CRPortalPage.module.css'

export default function CRPortalPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    venue: '', purpose: '', date: '', start_time: '', end_time: '', attendees: '1'
  })
  const [formError, setFormError] = useState('')

  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ['venues-list'],
    queryFn: () => api.get('/venues/').then(r => r.data.results),
  })

  const { data: myRequests = [] } = useQuery<VenueRequest[]>({
    queryKey: ['my-requests'],
    queryFn: () => api.get('/requests/').then(r => r.data.results),
  })

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/requests/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      setShowForm(false)
      setForm({ venue: '', purpose: '', date: '', start_time: '', end_time: '', attendees: '1' })
      setFormError('')
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setFormError(err?.response?.data?.detail ?? 'Failed to submit request. Please try again.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (form.start_time >= form.end_time) {
      setFormError('End time must be after start time.')
      return
    }
    submitMutation.mutate(form)
  }

  const statusColors: Record<string, string> = {
    PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected'
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Venue Requests</h1>
          <p className={styles.subtitle}>Welcome, {user?.full_name}. Submit and track your venue booking requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New Request
        </button>
      </div>

      {/* My Requests table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={th}>Venue</th>
              <th style={th}>Purpose</th>
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>Attendees</th>
              <th style={th}>Status</th>
              <th style={th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={td}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{req.venue_code}</span>
                  <br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{req.venue_name}</span>
                </td>
                <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.purpose}</td>
                <td style={td}>{new Date(req.date).toLocaleDateString('en-GB')}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {req.start_time.slice(0, 5)} – {req.end_time.slice(0, 5)}
                </td>
                <td style={td}>{req.attendees}</td>
                <td style={td}><span className={`badge ${statusColors[req.status]}`}>{req.status}</span></td>
                <td style={{ ...td, fontSize: 12, color: 'var(--gray-500)' }}>{req.admin_note || '—'}</td>
              </tr>
            ))}
            {myRequests.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                  No requests yet. Click "+ New Request" to book a venue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className={styles.backdrop} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>New Venue Request</div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{ background: 'var(--occupied-bg)', color: 'var(--occupied)', padding: '9px 12px', borderRadius: 6, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="label">Venue</label>
                <select className="input" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} required>
                  <option value="">Select a venue…</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.code} — {v.name} (Cap. {v.capacity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Purpose</label>
                <input className="input" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Makeup class, Group study session, Tutorial…" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
                </div>
              </div>

              <div>
                <label className="label">Expected Attendees</label>
                <input type="number" className="input" min={1} value={form.attendees}
                  onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} required />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left', fontSize: 12, fontWeight: 600,
  color: 'var(--gray-500)', textTransform: 'uppercase',
  letterSpacing: '.04em', padding: '11px 16px',
}
const td: React.CSSProperties = { padding: '11px 16px', fontSize: 14, color: 'var(--gray-700)' }
