import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { AcademicPeriod } from '../../types'
import s from './admin.module.css'

const SEMESTERS = ['Semester I', 'Semester II', 'Semester III', 'Annual', 'Special Semester']
const YEARS = Array.from({ length: 10 }, (_, i) => {
  const y = new Date().getFullYear() + i - 2
  return `${y}/${y + 1}`
})

const blank = { name: '', start_date: '', end_date: '', is_active: false }

export default function AcademicYears() {
  const qc = useQueryClient()
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<AcademicPeriod | null>(null)
  const [form, setForm]           = useState<any>(blank)
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [semPick, setSemPick]     = useState('Semester I')
  const [yearPick, setYearPick]   = useState(YEARS[2])

  const { data: periods = [], isLoading } = useQuery<AcademicPeriod[]>({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results ?? r.data),
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api.post('/timetable/periods/', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['periods'] }); setShowForm(false); setForm(blank) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/timetable/periods/${id}/`, d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['periods'] }); setEditing(null); setForm(blank) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/timetable/periods/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['periods'] }); setDeleteId(null) },
  })
  const activateMut = useMutation({
    mutationFn: (id: number) => api.post(`/timetable/periods/${id}/set-active/`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })

  const openCreate = () => {
    const name = `${semPick} ${yearPick}`
    setForm({ ...blank, name })
    setEditing(null)
    setShowForm(true)
  }
  const openEdit = (p: AcademicPeriod) => {
    setForm({ name: p.name, start_date: p.start_date, end_date: p.end_date, is_active: p.is_active })
    setEditing(p)
    setShowForm(true)
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, ...form })
    else createMut.mutate(form)
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Academic Years</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
            Manage academic periods and semesters. The active period is used for timetable imports.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Academic Period</button>
      </div>

      {/* Quick-build name helper */}
      <div className="card animate-fade-up delay-1" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--g600)', flexShrink: 0 }}>Quick Build:</span>
        <select className="input" style={{ width: 'auto', minWidth: 160 }} value={semPick} onChange={e => setSemPick(e.target.value)}>
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 120 }} value={yearPick} onChange={e => setYearPick(e.target.value)}>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={openCreate}>
          Create: <strong style={{ marginLeft: 4 }}>{semPick} {yearPick}</strong>
        </button>
      </div>

      {/* Periods list */}
      <div className="card animate-fade-up delay-2" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--g100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>All Academic Periods</span>
          <span style={{ fontSize: 13, color: 'var(--g400)' }}>{periods.length} period{periods.length !== 1 ? 's' : ''}</span>
        </div>
        {isLoading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--g400)' }}>Loading…</div>
          : !periods.length
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--g400)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🎓</div>
                <div style={{ fontWeight: 500 }}>No academic periods yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Create one to start importing timetables</div>
              </div>
            : <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p, i) => (
                    <tr key={p.id} className={`animate-fade-up delay-${Math.min(i + 1, 5)}`}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{p.start_date ? new Date(p.start_date).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ fontSize: 13 }}>{p.end_date ? new Date(p.end_date).toLocaleDateString('en-GB') : '—'}</td>
                      <td>
                        {p.is_active
                          ? <span className="badge badge-ok"><span className="live-dot" />Active</span>
                          : <span className="badge badge-gray">Inactive</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!p.is_active && (
                            <button className="btn btn-ok" style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => activateMut.mutate(p.id)} disabled={activateMut.isPending}>
                              ✓ Set Active
                            </button>
                          )}
                          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => openEdit(p)}>✏ Edit</button>
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setDeleteId(p.id)}>🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              {editing ? 'Edit Academic Period' : 'New Academic Period'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>
              {editing ? 'Update the period details below.' : 'Fill in the period details. You can set it active later.'}
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Period Name</label>
                <input className="input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Semester II 2024/2025" required />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {SEMESTERS.map(sem => (
                    <button key={sem} type="button"
                      className={`btn btn-ghost`}
                      style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => {
                        const parts = form.name.split(' ')
                        const yr = parts.find((p: string) => p.includes('/')) || yearPick
                        setForm((f: any) => ({ ...f, name: `${sem} ${yr}` }))
                      }}>{sem}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={form.start_date}
                    onChange={e => setForm((f: any) => ({ ...f, start_date: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={form.end_date}
                    onChange={e => setForm((f: any) => ({ ...f, end_date: e.target.value }))} required />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm((f: any) => ({ ...f, is_active: e.target.checked }))} />
                <span>Set as active period <span style={{ color: 'var(--g400)', fontSize: 11 }}>(deactivates others)</span></span>
              </label>
              {(createMut.isError || updateMut.isError) && (
                <div style={{ background: 'var(--bad-bg)', color: 'var(--bad)', padding: '9px 12px', borderRadius: 6, fontSize: 13 }}>
                  {(createMut.error as any)?.response?.data?.detail ?? (updateMut.error as any)?.response?.data?.detail ?? 'Error occurred.'}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? 'Saving…' : editing ? '✓ Update Period' : '+ Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Delete Period?</h3>
            <p style={{ fontSize: 13, color: 'var(--g500)', textAlign: 'center', marginBottom: 20 }}>
              This will delete the academic period and all its timetable sessions. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteMut.mutate(deleteId!)} disabled={deleteMut.isPending}>
                {deleteMut.isPending ? 'Deleting…' : '🗑 Delete Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
