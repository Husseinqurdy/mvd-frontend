import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { VenueRequest } from '../../types'
import styles from './AdminPage.module.css'

function fetchRequests(status: string) {
  const params = status !== 'ALL' ? `?status=${status}` : ''
  return api.get<{ results: VenueRequest[] }>(`/requests/${params}`).then(r => r.data.results)
}

export default function RequestsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [reviewing, setReviewing] = useState<VenueRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const { data: requests = [] } = useQuery({
    queryKey: ['requests', filter],
    queryFn: () => fetchRequests(filter),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: string; note: string }) =>
      api.post(`/requests/${id}/review/`, { action, admin_note: note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      setReviewing(null)
      setAdminNote('')
    },
  })

  const handleReview = (action: 'approve' | 'reject') => {
    if (!reviewing) return
    reviewMutation.mutate({ id: reviewing.id, action, note: adminNote })
  }

  const statusColors: Record<string, string> = {
    PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected'
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Venue Requests</h1>
      </div>

      {/* Filter tabs */}
      <div className={styles.actionsRow}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
            <button
              key={s}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Venue</th>
              <th>Requested By</th>
              <th>Purpose</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{req.venue_code}</span>
                  <br /><span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{req.venue_name}</span>
                </td>
                <td>{req.requested_by_name}</td>
                <td style={{ maxWidth: 200 }} className="truncate">{req.purpose}</td>
                <td>{new Date(req.date).toLocaleDateString('en-GB')}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {req.start_time.slice(0, 5)} – {req.end_time.slice(0, 5)}
                </td>
                <td>
                  <span className={`badge ${statusColors[req.status]}`}>{req.status}</span>
                </td>
                <td>
                  {req.status === 'PENDING' && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: 13 }}
                      onClick={() => { setReviewing(req); setAdminNote('') }}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={7} className={styles.emptyHint}>No requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className={styles.backdrop} onClick={() => setReviewing(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Review Request</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, fontSize: 14 }}>
              <div><strong>Venue:</strong> {reviewing.venue_code} — {reviewing.venue_name}</div>
              <div><strong>By:</strong> {reviewing.requested_by_name}</div>
              <div><strong>Purpose:</strong> {reviewing.purpose}</div>
              <div>
                <strong>Date & Time:</strong>{' '}
                {new Date(reviewing.date).toLocaleDateString('en-GB')}{' '}
                {reviewing.start_time.slice(0, 5)} – {reviewing.end_time.slice(0, 5)}
              </div>
              <div><strong>Attendees:</strong> {reviewing.attendees}</div>
            </div>

            <div className={styles.formGrid}>
              <div>
                <label className="label">Admin Note (optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Reason for approval or rejection…"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {reviewMutation.isError && (
              <div style={{ marginTop: 12, color: 'var(--occupied)', fontSize: 13 }}>
                {(reviewMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'An error occurred.'}
              </div>
            )}

            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReview('reject')} disabled={reviewMutation.isPending}>Reject</button>
              <button className="btn btn-success" onClick={() => handleReview('approve')} disabled={reviewMutation.isPending}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
