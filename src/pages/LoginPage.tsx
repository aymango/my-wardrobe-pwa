import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ALLOWED_EMAIL } from '../lib/supabase'

export function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState(ALLOWED_EMAIL)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить ссылку')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">👗</div>
        <h1>Мой гардероб</h1>
        <p>Личный шкаф, образы и идеи — всегда под рукой.</p>
        {sent ? (
          <div className="success-box">
            <b>Ссылка отправлена ✉️</b>
            <span>Откройте письмо на iPhone и нажмите на magic link.</span>
            <button className="button button--secondary" onClick={() => setSent(false)}>Отправить ещё раз</button>
          </div>
        ) : (
          <form onSubmit={submit} className="form-stack">
            <label className="field">
              <span>Электронная почта</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            {error && <div className="error-box">{error}</div>}
            <button className="button button--primary button--full" disabled={busy}>{busy ? 'Отправляю…' : 'Получить ссылку для входа'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
