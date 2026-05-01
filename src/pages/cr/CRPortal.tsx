import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { VenueRequest, VenueStatus, Venue } from '../../types'
import { useAuth } from '../../store/auth'

const BC: Record<string, string> = { PENDING: 'badge-warn', APPROVED: 'badge-ok', REJECTED: 'badge-bad' }
const blank = { venue: '', purpose: '', date: '', start_time: '', end_time: '', attendees: '1' }

interface TodaySession {
  session_id: number; course_code: string; course_name: string
  lecturer: string; start_time: string; end_time: string
  venue_code: string; venue_name: string; building: string
  cancelled: boolean; is_now: boolean; is_upcoming: boolean
}

export default function CRPortal() {
  const { user }  = useAuth()
  const qc        = useQueryClient()
  const [tab, setTab]         = useState<'available' | 'requests' | 'today'>('available')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState<any>(blank)
  const [err, setErr]         = useState('')
  const [lastResult, setLastResult] = useState<any>(null)
  const [cancelModal, setCancelModal] = useState<TodaySession | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const { data: statuses = [] } = useQuery<VenueStatus[]>({
    queryKey: ['statuses'],
    queryFn: () => api.get('/venues/status/').then(r => r.data),
    refetchInterval: 60000,
  })
  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: () => api.get('/venues/?is_active=true').then(r => r.data.results ?? r.data),
  })
  const { data: requests = [] } = useQuery<VenueRequest[]>({
    queryKey: ['my-requests'],
    queryFn: () => api.get('/requests/').then(r => r.data.results ?? r.data),
  })
  const { data: todaySessions = [] } = useQuery<TodaySession[]>({
    queryKey: ['today-sessions'],
    queryFn: () => api.get('/venues/today/').then(r => r.data),
    refetchInterval: 60000,
  })

  const available = statuses.filter(v => v.status === 'AVAILABLE')
  const approved  = requests.filter(r => r.status === 'APPROVED').length

  const submitMut = useMutation({
    mutationFn: (d: any) => api.post('/requests/', d).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['statuses'] })
      setShowForm(false)
      setForm(blank)
      setErr('')
      setLastResult(data)
      setTab('requests')
    },
    onError: (e: any) => setErr(e?.response?.data?.detail ?? 'Failed to submit.'),
  })

  const cancelMut = useMutation({
    mutationFn: ({ session_id, reason }: { session_id: number; reason: string }) =>
      api.post('/timetable/cancellations/cancel/', { session_id, date: today, reason }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-sessions'] })
      qc.invalidateQueries({ queryKey: ['statuses'] })
      setCancelModal(null); setCancelReason('')
    },
    onError: (e: any) => alert(e?.response?.data?.detail ?? 'Failed to cancel.'),
  })

  const restoreMut = useMutation({
    mutationFn: (session_id: number) =>
      api.post('/timetable/cancellations/restore/', { session_id, date: today }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-sessions'] })
      qc.invalidateQueries({ queryKey: ['statuses'] })
    },
    onError: (e: any) => alert(e?.response?.data?.detail ?? 'Failed to restore.'),
  })

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (form.start_time >= form.end_time) { setErr('End time must be after start time.'); return }
    submitMut.mutate(form)
  }

  return (
    <div style={{ padding: '26px 30px', maxWidth: 1050 }}>
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--g900)' }}>CR Portal</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>Welcome, <strong>{user?.full_name}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setForm(blank); setErr('') }}>+ Request Venue</button>
      </div>

      {/* Auto-confirm notification */}
      {lastResult && (
        <div className="animate-fade-up" style={{
          background: lastResult.status === 'APPROVED' ? 'var(--ok-bg)' : 'var(--warn-bg)',
          border: `1px solid ${lastResult.status === 'APPROVED' ? '#bbf7d0' : '#fde68a'}`,
          borderRadius: 10, padding: '14px 18px', marginBottom: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{lastResult.status === 'APPROVED' ? '✅' : '⏳'}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: lastResult.status === 'APPROVED' ? 'var(--ok)' : 'var(--warn)' }}>
                {lastResult.status === 'APPROVED' ? 'Request Auto-Confirmed!' : 'Request Pending Approval'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 2 }}>
                {lastResult.status === 'APPROVED'
                  ? 'Venue was available — your booking has been automatically confirmed.'
                  : 'There may be a conflict. Admin will review your request shortly.'}
              </div>
            </div>
          </div>
          <button onClick={() => setLastResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--g400)' }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          ['Available', available.length, 'var(--ok)', '🟢'],
          ['My Requests', requests.length, 'var(--g800)', '📋'],
          ['Approved', approved, 'var(--brand)', '✅'],
          ["Today's Sessions", todaySessions.length, 'var(--warn)', '📅'],
        ].map(([l, v, c, icon]) => (
          <div key={String(l)} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 11, color: 'var(--g400)' }}>{l}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: String(c) }} className="animate-count">{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="animate-fade-up delay-2" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['available', '🟢 Available Venues'], ['today', "📅 Today's Sessions"], ['requests', '📋 My Requests']].map(([id, label]) => (
          <button key={id} className={`btn ${tab === id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setTab(id as any)}>{label}</button>
        ))}
      </div>

      {/* Available Venues */}
      {tab === 'available' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
          {available.map((v, i) => (
            <div key={v.venue_id} className={`card animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="chip">{v.venue_code}</span>
                <span className="badge badge-ok" style={{ fontSize: 11 }}>● FREE</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{v.venue_name}</div>
              <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 2 }}>{v.building} · Cap. {v.capacity}</div>
              {v.next_session && (
                <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 6, padding: '4px 8px', background: 'var(--warn-bg)', borderRadius: 4 }}>
                  ⏰ Next: {v.next_session.course_code} at {v.next_session.start_time}
                </div>
              )}
              <button className="btn btn-ok" style={{ marginTop: 10, width: '100%', justifyContent: 'center', padding: '6px', fontSize: 12 }}
                onClick={() => { setShowForm(true); setForm({ ...blank, venue: String(v.venue_id) }); setErr('') }}>
                ⚡ Request this venue
              </button>
            </div>
          ))}
          {!available.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--g400)' }} className="card">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <div>All venues are currently occupied.</div>
            </div>
          )}
        </div>
      )}

      {/* Today's Sessions */}
      {tab === 'today' && (
        <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr>
              <th>Time</th><th>Course</th><th>Venue</th><th>Lecturer</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {todaySessions.map((s, i) => (
                <tr key={s.session_id} className={`animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}
                  style={{ background: s.cancelled ? 'var(--bad-bg)' : s.is_now ? 'var(--ok-bg)' : undefined }}>
                  <td className="mono">{s.start_time}–{s.end_time}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.course_code}</div>
                    <div style={{ fontSize: 12, color: 'var(--g400)' }}>{s.course_name}</div>
                  </td>
                  <td><span className="chip">{s.venue_code}</span></td>
                  <td style={{ fontSize: 13 }}>{s.lecturer}</td>
                  <td>
                    {s.cancelled
                      ? <span className="badge badge-bad" style={{ fontSize: 11 }}>CANCELLED</span>
                      : s.is_now
                        ? <span className="badge badge-ok" style={{ fontSize: 11 }}>● IN PROGRESS</span>
                        : <span className="badge badge-gray" style={{ fontSize: 11 }}>UPCOMING</span>
                    }
                  </td>
                  <td>
                    {!s.cancelled && (
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => { setCancelModal(s); setCancelReason('') }}>
                        Cancel
                      </button>
                    )}
                    {s.cancelled && (
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => restoreMut.mutate(s.session_id)} disabled={restoreMut.isPending}>
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!todaySessions.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--g400)' }}>No sessions today.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* My Requests */}
      {tab === 'requests' && (
        <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr><th>Venue</th><th>Purpose</th><th>Date</th><th>Time</th><th>Attendees</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} className={`animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}>
                  <td><span className="chip">{r.venue_code}</span></td>
                  <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose}</td>
                  <td style={{ fontSize: 13 }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                  <td className="mono">{r.start_time.slice(0,5)}–{r.end_time.slice(0,5)}</td>
                  <td style={{ fontSize: 13 }}>{r.attendees}</td>
                  <td><span className={`badge ${BC[r.status]}`}>{r.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--g500)' }}>{r.admin_note || '—'}</td>
                </tr>
              ))}
              {!requests.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--g400)' }}>No requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 420, padding: 26 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Mark Session as Cancelled</h2>
            <div style={{ background: 'var(--g50)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 14 }}>
              <div><strong>{cancelModal.course_code}</strong> — {cancelModal.course_name}</div>
              <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 4 }}>{cancelModal.start_time}–{cancelModal.end_time} · {cancelModal.venue_code}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Reason (optional)</label>
              <input className="input" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Lecturer absent, public holiday…" />
            </div>
            <p style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 16, padding: '8px 12px', background: 'var(--warn-bg)', borderRadius: 6 }}>
              ⚠ This will mark the venue as available on the TV display for today.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setCancelModal(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={cancelMut.isPending}
                onClick={() => cancelMut.mutate({ session_id: cancelModal.session_id, reason: cancelReason })}>
                {cancelMut.isPending ? 'Saving…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 480, padding: 26 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Request a Venue</h2>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 18 }}>
              If the venue is available, your request will be <strong style={{ color: 'var(--ok)' }}>auto-confirmed instantly</strong>.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {err && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad)', padding: '9px 12px', borderRadius: 6, fontSize: 13 }}>{err}</div>}
              <div>
                <label className="label">Venue</label>
                <select className="input" value={form.venue} onChange={e => set('venue', e.target.value)} required>
                  <option value="">Select venue…</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.code} — {v.name} (Cap. {v.capacity})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Purpose</label>
                <input className="input" value={form.purpose} onChange={e => set('purpose', e.target.value)} placeholder="e.g. Makeup class, Group discussion…" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
                <div><label className="label">Start</label><input type="time" className="input" value={form.start_time} onChange={e => set('start_time', e.target.value)} required /></div>
                <div><label className="label">End</label><input type="time" className="input" value={form.end_time} onChange={e => set('end_time', e.target.value)} required /></div>
              </div>
              <div>
                <label className="label">Expected Attendees</label>
                <input type="number" className="input" min={1} value={form.attendees} onChange={e => set('attendees', e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitMut.isPending}>
                  {submitMut.isPending ? 'Submitting…' : '⚡ Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
