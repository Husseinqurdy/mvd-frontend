import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { User } from '../../types'
import s from './admin.module.css'

const ROLES = ['ADMIN', 'CLASS_REP', 'LECTURER'] as const
const RC: Record<string, string> = { ADMIN: 'badge-bad', CLASS_REP: 'badge-warn', LECTURER: 'badge-ok' }
const blank = { email: '', full_name: '', role: 'LECTURER', department: '', phone: '', password: '', is_active: true }

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal]       = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [form, setForm]         = useState<any>(blank)
  const [formErr, setFormErr]   = useState('')
  const [delId, setDelId]       = useState<number | null>(null)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/accounts/users/').then(r => r.data.results ?? r.data),
  })

  const saveMut = useMutation({
    mutationFn: (d: any) => modal === 'add'
      ? api.post('/accounts/users/', d).then(r => r.data)
      : api.patch(`/accounts/users/${selected!.id}/`, d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal() },
    onError: (e: any) => setFormErr(e?.response?.data?.email?.[0] ?? e?.response?.data?.detail ?? 'Error saving user.'),
  })

  const delMut = useMutation({
    mutationFn: (id: number) => api.delete(`/accounts/users/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDelId(null) },
  })

  const openAdd  = () => { setForm(blank); setFormErr(''); setModal('add') }
  const openEdit = (u: User) => {
    setSelected(u)
    setForm({ full_name: u.full_name, role: u.role, department: u.department, phone: u.phone, is_active: u.is_active })
    setFormErr(''); setModal('edit')
  }
  const closeModal = () => { setModal(null); setSelected(null); setFormErr('') }
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q)
    }
    return true
  })

  const counts = { ADMIN: users.filter(u => u.role === 'ADMIN').length, CLASS_REP: users.filter(u => u.role === 'CLASS_REP').length, LECTURER: users.filter(u => u.role === 'LECTURER').length }

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Users ({users.length})</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
            {counts.ADMIN} admins · {counts.LECTURER} lecturers · {counts.CLASS_REP} class reps
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {/* Filters */}
      <div className="animate-fade-up delay-1" style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input className="input" style={{ width: 260 }} placeholder="🔍  Search name, email, department…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn ${!roleFilter ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '7px 14px', fontSize: 13 }}
            onClick={() => setRoleFilter('')}>All</button>
          {ROLES.map(r => (
            <button key={r} className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={() => setRoleFilter(r === roleFilter ? '' : r)}>
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card animate-fade-up delay-2" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--g400)' }}>Loading…</td></tr>}
            {!isLoading && filtered.map((u, i) => (
              <tr key={u.id} className={`animate-fade-up delay-${Math.min(i % 5 + 1, 5)}`}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#dc2626,#f87171)' : u.role === 'CLASS_REP' ? 'linear-gradient(135deg,#d97706,#fbbf24)' : 'linear-gradient(135deg,#16a34a,#4ade80)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 13,
                    }}>{u.full_name[0]?.toUpperCase()}</div>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{u.full_name}</span>
                  </div>
                </td>
                <td className="mono" style={{ fontSize: 13 }}>{u.email}</td>
                <td><span className={`badge ${RC[u.role]}`}>{u.role.replace('_', ' ')}</span></td>
                <td style={{ fontSize: 13, color: 'var(--g500)' }}>{u.department || '—'}</td>
                <td><span className={`badge ${u.is_active ? 'badge-ok' : 'badge-gray'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => openEdit(u)}>✏ Edit</button>
                    <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setDelId(u.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !filtered.length && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--g400)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                <div>No users found.</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{modal === 'add' ? '+ Add New User' : '✏ Edit User'}</h2>
            <form onSubmit={e => { e.preventDefault(); setFormErr(''); saveMut.mutate(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formErr && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad)', padding: '9px 12px', borderRadius: 6, fontSize: 13 }}>{formErr}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
                </div>
                {modal === 'add' && (
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" value={form.department} onChange={e => set('department', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                {modal === 'add' && (
                  <div>
                    <label className="label">Password</label>
                    <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                  </div>
                )}
              </div>
              {modal === 'edit' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                  Active account
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveMut.isPending}>
                  {saveMut.isPending ? 'Saving…' : modal === 'add' ? '+ Create User' : '✓ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="modal-overlay" onClick={() => setDelId(null)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 380, padding: 26 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Delete User?</h3>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 22 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDelId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => delMut.mutate(delId)} disabled={delMut.isPending}>
                {delMut.isPending ? 'Deleting…' : '🗑 Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
