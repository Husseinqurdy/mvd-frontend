import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { AcademicPeriod, ImportLog } from '../../types'
import s from './admin.module.css'

type Src = 'pdf' | 'excel' | 'csv'

export default function ImportPage() {
  const qc = useQueryClient()
  const [file, setFile]       = useState<File | null>(null)
  const [pid, setPid]         = useState('')
  const [src, setSrc]         = useState<Src>('pdf')
  const [replace, setReplace] = useState(false)
  const [result, setResult]   = useState<any>(null)
  const [drag, setDrag]       = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [clearAll, setClearAll] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(localStorage.getItem('institution_logo'))

  const { data: periods = [] } = useQuery<AcademicPeriod[]>({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results ?? r.data),
  })
  const { data: logs = [] } = useQuery<ImportLog[]>({
    queryKey: ['import-logs'],
    queryFn: () => api.get('/timetable/import/logs/').then(r => r.data),
  })

  const mut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file!)
      fd.append('period_id', pid)
      fd.append('replace', String(replace))
      return api.post(`/timetable/import/${src}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
    },
    onSuccess: d => { setResult(d); qc.invalidateQueries({ queryKey: ['import-logs'] }); qc.invalidateQueries({ queryKey: ['sessions'] }) },
  })

  const deleteLogMut = useMutation({
    mutationFn: (id: number) => api.delete(`/timetable/import/logs/delete/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['import-logs'] }); setDeleteId(null) },
  })
  const clearLogsMut = useMutation({
    mutationFn: () => api.delete('/timetable/import/logs/clear/'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['import-logs'] }); setClearAll(false) },
  })

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); autoSrc(f) }
  }
  const autoSrc = (f: File) => {
    if (f.name.endsWith('.pdf')) setSrc('pdf')
    else if (f.name.endsWith('.csv')) setSrc('csv')
    else setSrc('excel')
  }

  const dlTemplate = () => {
    api.get('/timetable/import/template/', { responseType: 'blob' }).then(r => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(r.data)
      a.download = 'timetable_template.xlsx'
      a.click()
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      localStorage.setItem('institution_logo', url)
      setLogoPreview(url)
    }
    reader.readAsDataURL(f)
  }

  const removeLogo = () => {
    localStorage.removeItem('institution_logo')
    setLogoPreview(null)
  }

  const sc = (st: string) => st === 'SUCCESS' ? 'var(--ok)' : st === 'PARTIAL' ? 'var(--warn)' : 'var(--bad)'

  return (
    <div className={s.page}>
      <div className={s.pageHead + ' animate-fade-up'}>
        <div>
          <h1 className={s.pageTitle}>Import Timetable</h1>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>Upload MUST timetable PDF, Excel or CSV. Venues are created automatically.</p>
        </div>
        <button className="btn btn-ghost" onClick={dlTemplate}>⬇ Excel Template</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload card */}
          <div className="card animate-fade-up delay-1" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Upload File</div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('fi')?.click()}
              style={{
                border: `2px dashed ${drag ? 'var(--brand)' : file ? 'var(--ok)' : 'var(--g300)'}`,
                borderRadius: 8, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                background: drag ? 'var(--brand-light)' : file ? 'var(--ok-bg)' : undefined,
                transition: 'all .2s', marginBottom: 18,
              }}
            >
              <input id="fi" type="file" accept=".pdf,.xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); autoSrc(f) } }} />
              {file ? (
                <div>
                  <div style={{ fontSize: 28 }}>📄</div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--g800)', marginTop: 6 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--g400)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 30 }}>📂</div>
                  <div style={{ fontSize: 14, color: 'var(--g500)', marginTop: 6 }}>Drop PDF, Excel, or CSV here</div>
                  <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 3 }}>or click to browse</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">File Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['pdf', 'excel', 'csv'] as Src[]).map(x => (
                    <button key={x} className={`btn ${src === x ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, justifyContent: 'center', padding: '7px' }}
                      onClick={() => setSrc(x)}>{x.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Academic Period</label>
                <select className="input" value={pid} onChange={e => setPid(e.target.value)}>
                  <option value="">Select period…</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.name}{p.is_active ? ' ✓' : ''}</option>)}
                </select>
                {!periods.length && (
                  <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 4 }}>
                    No periods found. <a href="/dashboard/academic-years" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>Create one first →</a>
                  </div>
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} style={{ marginTop: 2 }} />
                <div>Replace existing sessions<br /><span style={{ color: 'var(--g400)', fontSize: 11 }}>Deletes previous PDF/Excel sessions for this period</span></div>
              </label>

              {mut.isError && (
                <div style={{ background: 'var(--bad-bg)', color: 'var(--bad)', padding: '9px 12px', borderRadius: 6, fontSize: 13 }}>
                  {(mut.error as any)?.response?.data?.detail ?? 'Upload failed.'}
                </div>
              )}
              <button className="btn btn-primary" style={{ justifyContent: 'center' }}
                disabled={!file || !pid || mut.isPending} onClick={() => mut.mutate()}>
                {mut.isPending
                  ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 7 }}>⟳</span>Importing…</>
                  : '⬆ Import Timetable'}
              </button>
              {mut.isPending && (
                <div style={{ background: 'var(--warn-bg)', border: '1px solid #fde68a', borderRadius: 7, padding: '10px 13px', fontSize: 12, color: 'var(--warn)' }}>
                  ⏳ <strong>PDF import in progress.</strong> Large files may take 1–3 minutes. Do not close this page.
                </div>
              )}
            </div>
          </div>

          {/* Institution Logo */}
          <div className="card animate-fade-up delay-2" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🏫 Institution Logo</div>
            <p style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 12 }}>
              Logo appears in the sidebar and TV Display header.
            </p>
            {logoPreview ? (
              <div style={{ textAlign: 'center' }}>
                <img src={logoPreview} alt="Logo" style={{ maxHeight: 80, maxWidth: '100%', borderRadius: 8, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    onClick={() => logoRef.current?.click()}>Change</button>
                  <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    onClick={removeLogo}>Remove</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => logoRef.current?.click()}>
                📷 Upload Logo
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          </div>
        </div>

        <div>
          {/* Result */}
          {result && (
            <div className="card animate-fade-up" style={{ padding: 22, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Import Result</div>
              <div style={{ padding: '9px 13px', borderRadius: 6, background: result.status === 'success' ? 'var(--ok-bg)' : 'var(--warn-bg)', color: result.status === 'success' ? 'var(--ok)' : 'var(--warn)', fontWeight: 500, fontSize: 14, marginBottom: 10 }}>
                {result.status === 'success' ? '✓ Import successful' : '⚠ Partial import'} — {result.message}
              </div>
              <div style={{ display: 'flex', gap: 20, padding: '12px 0', borderTop: '1px solid var(--g100)' }}>
                {[['Sessions Created', result.sessions_created, 'var(--ok)'], ['Skipped', result.sessions_skipped, 'var(--warn)'], ['New Venues', result.venues_created, 'var(--brand)']].map(([l, v, c]) => (
                  <div key={String(l)} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: String(c) }} className="animate-count">{v}</div>
                    <div style={{ fontSize: 11, color: 'var(--g400)' }}>{l}</div>
                  </div>
                ))}
              </div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {result.errors.map((e: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--bad)', padding: '2px 0' }}>• {e}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Import History with delete */}
          <div className="card animate-fade-up delay-2" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Import History</span>
              {logs.length > 0 && (
                <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => setClearAll(true)}>
                  🗑 Clear All
                </button>
              )}
            </div>
            {!logs.length
              ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--g400)', fontSize: 14 }}>No imports yet.</div>
              : <table className="tbl">
                  <thead><tr><th>Source</th><th>Period</th><th>Status</th><th>Created</th><th>Skipped</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} className="animate-fade-up">
                        <td><span className="chip">{l.source.toUpperCase()}</span></td>
                        <td style={{ fontSize: 13 }}>{l.period_name || '—'}</td>
                        <td><span style={{ fontWeight: 600, color: sc(l.status), fontSize: 12 }}>{l.status}</span></td>
                        <td style={{ color: 'var(--ok)', fontSize: 13 }}>{l.sessions_created}</td>
                        <td style={{ color: 'var(--g400)', fontSize: 13 }}>{l.sessions_skipped}</td>
                        <td style={{ fontSize: 12, color: 'var(--g400)' }}>{new Date(l.created_at).toLocaleDateString('en-GB')}</td>
                        <td>
                          <button
                            onClick={() => setDeleteId(l.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g400)', fontSize: 16, padding: '2px 4px', borderRadius: 4, transition: 'all .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--bad)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--g400)')}
                            title="Delete this log">🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>
      </div>

      {/* Delete single log confirmation */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 380, padding: 26 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Import Log?</h3>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>This log entry will be removed. Timetable sessions imported from it remain unaffected.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteLogMut.mutate(deleteId!)} disabled={deleteLogMut.isPending}>
                {deleteLogMut.isPending ? 'Deleting…' : '🗑 Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all confirmation */}
      {clearAll && (
        <div className="modal-overlay" onClick={() => setClearAll(false)}>
          <div className="modal-box" style={{ width: '100%', maxWidth: 380, padding: 26 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Clear All Import History?</h3>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>All {logs.length} import log entries will be removed. Timetable data remains intact.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setClearAll(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => clearLogsMut.mutate()} disabled={clearLogsMut.isPending}>
                {clearLogsMut.isPending ? 'Clearing…' : '🗑 Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
