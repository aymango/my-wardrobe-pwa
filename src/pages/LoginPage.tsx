import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ALLOWED_EMAIL } from '../lib/supabase'

export function LoginPage() {
  const { user, loading, signIn } = useAuth()

  const [email, setEmail] = useState(ALLOWED_EMAIL)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось войти в приложение'
      )
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

        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field">
            <span>Электронная почта</span>

            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Пароль</span>

            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 15
            }}
          >
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />

            Показать пароль
          </label>

          {error && <div className="error-box">{error}</div>}

          <button
            type="submit"
            className="button button--primary button--full"
            disabled={busy}
          >
            {busy ? 'Вхожу…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}