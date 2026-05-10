import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { VenueRequest } from '../../types'
import s from './admin.module.css'

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
const BC: Record<string, string> = { PENDING: 'badge-warn', APPROVED: 'badge-ok', REJECTED: 'badge-bad' }

export default function RequestsAdmin() {
  const qc = useQueryClient()
  const [filter, setFilter]       = useState<Filter>('PENDING')
  const [reviewing, setReviewing] = useState<VenueRequest | null>(null)
  const [note, setNote]           = useState('')
  const [err, setErr]             = useState('')

  const { data: requests = [], isLoading } = useQuery<VenueRequest[]>({
    queryKey: ['requests', filter],
    queryFn: () => {
      const qs = filter !== 'ALL' ? `?status=${filter}` : ''
      return api.get(`/requests/${qs}`).then(r => r.data.results ?? r.data)
    },
  })

  const reviewMut = useMutation({
    mutationFn: ({ id, action, admin_note }: { id: number; action: string; admin_note: string }) =>
      api.post(`/requests/${id}/review/`, { action, admin_note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['pending-requests'] })
      qc.invalidateQueries({ queryKey: ['statuses'] })      // update venue status cards
      qc.invalidateQueries({ queryKey: ['today-sessions'] }) // update TV display data
      setReviewing(null); setNote(''); setErr('')
    },
    onError: (e: any) => setErr(e?.response?.data?.detail ?? 'Review failed.'),
  })

  const counts = {
    ALL:      requests.length,
    PENDING:  requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  }

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Venue Requests</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
            Available venues are auto-confirmed. Conflicted requests need manual review.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="animate-fade-up delay-1" style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as Filter[]).map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '7px 18px', fontSize: 13, position: 'relative' }}
            onClick={() => setFilter(f)}>
            {f}
            {f === 'PENDING' && counts.PENDING > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--bad)', color: '#fff',
                fontSize: 10, fontWeight: 700, padding: '1px 5px',
                borderRadius: 99, minWidth: 16, textAlign: 'center',
              }}>{counts.PENDING}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card animate-fade-up delay-2" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr>
            <th>Venue</th><th>Requested By</th><th>Purpose</th><th>Date</th><th>Time</th><th>Pax</th><th>Status</th><th>Source</th><th>Action</th>
          </tr></thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--g400)' }}>Loading…</td></tr>
            )}
            {!isLoading && requests.map((r, i) => (
              <tr key={r.id} className={`animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}>
                <td>
                  <span className="chip">{r.venue_code}</span>
                  <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 2 }}>{r.venue_name}</div>
                </td>
                <td style={{ fontSize: 13, fontWeight: 500 }}>{r.requested_by_name}</td>
                <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose}</td>
                <td style={{ fontSize: 13 }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                <td className="mono">{r.start_time.slice(0,5)}–{r.end_time.slice(0,5)}</td>
                <td style={{ fontSize: 13 }}>{r.attendees}</td>
                <td><span className={`badge ${BC[r.status]}`}>{r.status}</span></td>
                <td style={{ fontSize: 11, color: 'var(--g400)' }}>
                  {r.admin_note?.includes('Auto-confirmed') ? (
                    <span style={{ color: 'var(--ok)', fontSize: 11, fontWeight: 500 }}>⚡ Auto</span>
                  ) : r.reviewed_by_name ? (
                    <span>{r.reviewed_by_name}</span>
                  ) : '—'}
                </td>
                <td>
                  {r.status === 'PENDING'
                    ? <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => { setReviewing(r); setNote(''); setErr('') }}>Review</button>
                    : <span style={{ fontSize: 11, color: 'var(--g300)' }}>✓ Done</span>
                  }
                </td>
              </tr>
            ))}
            {!isLoading && !requests.length && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--g400)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <div>No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests.</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="modal-overlay" onClick={() => setReviewing(null)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 500, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Review Request</h2>
            <div style={{ background: 'var(--g50)', borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div><span style={{ color: 'var(--g400)', fontSize: 12 }}>VENUE</span><br /><strong>{reviewing.venue_code}</strong> — {reviewing.venue_name}</div>
                <div><span style={{ color: 'var(--g400)', fontSize: 12 }}>CAPACITY</span><br />{reviewing.capacity}</div>
              </div>
              <div style={{ display: 'flex', gap: 20, paddingTop: 8, borderTop: '1px solid var(--g200)' }}>
                <div><span style={{ color: 'var(--g400)', fontSize: 12 }}>REQUESTED BY</span><br />{reviewing.requested_by_name}</div>
                <div><span style={{ color: 'var(--g400)', fontSize: 12 }}>DATE</span><br />{new Date(reviewing.date).toLocaleDateString('en-GB')}</div>
                <div><span style={{ color: 'var(--g400)', fontSize: 12 }}>TIME</span><br /><span className="mono">{reviewing.start_time.slice(0,5)}–{reviewing.end_time.slice(0,5)}</span></div>
              </div>
              <div style={{ paddingTop: 8, borderTop: '1px solid var(--g200)' }}>
                <span style={{ color: 'var(--g400)', fontSize: 12 }}>PURPOSE</span><br />{reviewing.purpose}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Admin Note (optional)</label>
              <textarea className="input" rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Reason for approval or rejection…" style={{ resize: 'vertical' }} />
            </div>
            {err && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad)', padding: '9px 12px', borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={reviewMut.isPending}
                onClick={() => reviewMut.mutate({ id: reviewing.id, action: 'reject', admin_note: note })}>
                ✗ Reject
              </button>
              <button className="btn btn-ok" disabled={reviewMut.isPending}
                onClick={() => reviewMut.mutate({ id: reviewing.id, action: 'approve', admin_note: note })}>
                ✓ Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
