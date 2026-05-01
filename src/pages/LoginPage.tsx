import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import s from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)

  const logoUrl = localStorage.getItem('institution_logo')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      await login(email, password)
      nav('/', { replace: true })
    } catch {
      setErr('Invalid email or password.')
    } finally { setLoading(false) }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.top}>
          <div className={s.logoWrap}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className={s.logoImg} />
              : <span className={s.logo}>M</span>
            }
          </div>
          <h1 className={s.title}>MUST Venue Display</h1>
          <p className={s.sub}>Mbeya University of Science and Technology</p>
        </div>

        <form onSubmit={submit} className={s.form}>
          {err && <div className={s.err}>⚠ {err}</div>}
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@must.ac.tz" required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ paddingRight: 40 }} />
              <button type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g400)', fontSize: 16 }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 15, marginTop: 4 }}
            disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className={s.tvlink}>
          <a href="/display" target="_blank" rel="noreferrer">📺 Open TV Display →</a>
        </div>
      </div>
    </div>
  )
}
