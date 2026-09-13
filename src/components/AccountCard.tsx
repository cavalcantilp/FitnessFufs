import { useApp } from '../state/AppContext'

/**
 * La connexion se fait désormais à l'ouverture de l'app (AuthGateScreen) : ici,
 * uniquement la déconnexion, une fois identifié — rien d'autre à faire depuis
 * le profil. Invisible si aucun compte n'est configuré ou si personne n'est
 * connecté (session ignorée à l'ouverture, ou projet Supabase absent).
 */
export function AccountCard() {
  const { t, accountAvailable, user, signOut } = useApp()

  if (!accountAvailable || !user) return null

  return (
    <div className="card stack">
      <div className="card-title">{t('account.title')}</div>
      <div className="figure-row">
        <span className="name">{t('account.connectedAs')}</span>
        <span className="value">{user.email}</span>
      </div>
      <button type="button" className="btn secondary" onClick={() => void signOut()}>
        {t('account.signOut')}
      </button>
    </div>
  )
}
