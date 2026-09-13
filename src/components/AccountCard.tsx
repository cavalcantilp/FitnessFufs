import { useState } from 'react'
import { useApp } from '../state/AppContext'

/**
 * Invisible tant que le projet Supabase n'est pas configuré (clés absentes du
 * build) : la fonctionnalité de compte n'existe pas encore pour l'utilisateur
 * plutôt que de s'afficher cassée.
 */
export function AccountCard() {
  const {
    t,
    accountAvailable,
    user,
    authLoading,
    authError,
    clearAuthError,
    rememberMe,
    setRememberMe,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut,
  } = useApp()

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  if (!accountAvailable) return null

  const submit = async () => {
    if (!email.trim() || !password) return
    setSubmitting(true)
    setInfo(null)
    const result =
      mode === 'signIn' ? await signInWithPassword(email.trim(), password) : await signUpWithPassword(email.trim(), password)
    setSubmitting(false)
    if (result.ok && mode === 'signUp') {
      setInfo(t('account.confirmEmail'))
    }
  }

  const withGoogle = async () => {
    setSubmitting(true)
    await signInWithGoogle()
    setSubmitting(false)
  }

  return (
    <div className="card stack">
      <div className="card-title">{t('account.title')}</div>

      {authLoading ? <p className="hint">{t('account.loading')}</p> : null}

      {!authLoading && user ? (
        <div className="stack">
          <div className="figure-row">
            <span className="name">{t('account.connectedAs')}</span>
            <span className="value">{user.email}</span>
          </div>
          <button type="button" className="btn secondary" onClick={() => void signOut()}>
            {t('account.signOut')}
          </button>
        </div>
      ) : null}

      {!authLoading && !user ? (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="chip-list">
            <button
              type="button"
              className={`chip${mode === 'signIn' ? ' active' : ''}`}
              onClick={() => {
                setMode('signIn')
                clearAuthError()
                setInfo(null)
              }}
            >
              {t('account.signIn')}
            </button>
            <button
              type="button"
              className={`chip${mode === 'signUp' ? ' active' : ''}`}
              onClick={() => {
                setMode('signUp')
                clearAuthError()
                setInfo(null)
              }}
            >
              {t('account.signUp')}
            </button>
          </div>

          <div className="field">
            <label htmlFor="account-email">{t('account.email')}</label>
            <input
              id="account-email"
              name="account-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="account-password">{t('account.password')}</label>
            <input
              id="account-password"
              name="account-password"
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            {t('account.rememberMe')}
          </label>

          {authError ? <p className="notice chat-error">{authError}</p> : null}
          {info ? <p className="notice info">{info}</p> : null}

          <button type="submit" className="btn" disabled={submitting || !email.trim() || !password}>
            {mode === 'signIn' ? t('account.signIn') : t('account.signUp')}
          </button>

          <button type="button" className="btn secondary" onClick={() => void withGoogle()} disabled={submitting}>
            {t('account.continueWithGoogle')}
          </button>
        </form>
      ) : null}
    </div>
  )
}
