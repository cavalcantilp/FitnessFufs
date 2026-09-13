import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { IconGoogle, Logo } from './icons'

interface AuthGateScreenProps {
  /** Appelé une fois la porte franchie — connexion restaurée (après l'accueil), ou passée sciemment. */
  onProceed: () => void
}

/** Un accueil bref donne l'impression que la session se recharge, plutôt qu'un saut instantané sans transition. */
const GREETING_DELAY_MS = 1400

/** Faute de nom d'usage saisi à l'inscription, la partie locale de l'e-mail sert de prénom d'accueil. */
function displayName(email: string | null): string {
  if (!email) return ''
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

/**
 * Porte d'entrée affichée à chaque ouverture de l'app tant qu'aucune session
 * n'est active : une session « dont on se souvient » (case cochée à la
 * connexion) passe directement à l'accueil bref, sans jamais montrer ce
 * formulaire — sinon, il bloque l'accès, avec une échappatoire pour
 * continuer hors connexion.
 */
export function AuthGateScreen({ onProceed }: AuthGateScreenProps) {
  const { t, user, authLoading, authError, rememberMe, setRememberMe, signInWithPassword, signUpWithPassword, signInWithGoogle } =
    useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const greetingStarted = useRef(false)
  // Toujours la dernière fonction reçue, sans jamais être une dépendance d'effet :
  // un onProceed recréé à chaque rendu du parent ne doit plus jamais pouvoir
  // annuler ce minuteur en cours de route (déjà arrivé une fois — voir App.tsx).
  const onProceedRef = useRef(onProceed)
  onProceedRef.current = onProceed

  useEffect(() => {
    if (!authLoading && user && !greetingStarted.current) {
      greetingStarted.current = true
      const timer = window.setTimeout(() => onProceedRef.current(), GREETING_DELAY_MS)
      return () => window.clearTimeout(timer)
    }
  }, [authLoading, user])

  if (authLoading || user) {
    return (
      <div className="onboarding auth-splash">
        <div className="brand">
          <Logo />
          {user ? <p className="auth-greeting">{t('account.greeting', { name: displayName(user.email) })}</p> : null}
        </div>
      </div>
    )
  }

  /** "Se connecter" (bouton) et "Créer un compte" (texte) sont deux actions fixes,
   * jamais un même bouton dont le libellé bascule — chacune part des mêmes champs. */
  const runAuth = async (kind: 'signIn' | 'signUp') => {
    if (!email.trim() || !password || submitting) return
    setSubmitting(true)
    setInfo(null)
    setLocalError(null)
    try {
      const result = kind === 'signIn' ? await signInWithPassword(email.trim(), password) : await signUpWithPassword(email.trim(), password)
      if (result.ok && kind === 'signUp') setInfo(t('account.confirmEmail'))
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const withGoogle = async () => {
    if (submitting) return
    setSubmitting(true)
    setLocalError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="brand">
        <Logo />
        <h1>{t('app.name')}</h1>
        <p>{t('app.tagline')}</p>
      </div>

      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          void runAuth('signIn')
        }}
      >
        <div className="field">
          <label htmlFor="gate-email">{t('account.email')}</label>
          <input
            id="gate-email"
            name="gate-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="gate-password">{t('account.password')}</label>
          <input
            id="gate-password"
            name="gate-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <label className="auth-remember">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          {t('account.rememberMe')}
        </label>

        {authError || localError ? <p className="notice chat-error">{authError ?? localError}</p> : null}
        {info ? <p className="notice info">{info}</p> : null}

        <button type="submit" className="btn" disabled={submitting || !email.trim() || !password}>
          {submitting ? t('account.loading') : t('account.signIn')}
        </button>

        <button
          type="button"
          className="auth-skip"
          disabled={submitting || !email.trim() || !password}
          onClick={() => void runAuth('signUp')}
        >
          {t('account.signUp')}
        </button>

        <button type="button" className="auth-skip" onClick={onProceed}>
          {t('account.skip')}
        </button>

        <hr className="auth-divider" />

        <button type="button" className="btn secondary auth-google" onClick={() => void withGoogle()} disabled={submitting}>
          <IconGoogle size={18} />
          {t('account.continueWithGoogle')}
        </button>
      </form>
    </div>
  )
}
