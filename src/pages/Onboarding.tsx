import { useApp } from '../state/AppContext'
import { ProfileForm } from '../components/ProfileForm'
import { Logo } from '../components/icons'
import { LANGS } from '../i18n/translations'
import type { Lang } from '../lib/types'

/** Première ouverture : langue, profil, puis calcul immédiat des objectifs. */
export function Onboarding() {
  const { t, lang, setLang, completeOnboarding } = useApp()

  return (
    <div className="onboarding">
      <div className="brand">
        <Logo />
        <h1>{t('onboarding.welcome')}</h1>
        <p>{t('onboarding.intro')}</p>
      </div>

      <div className="field">
        <label htmlFor="ob-lang">{t('profile.language')}</label>
        <select
          id="ob-lang"
          value={lang}
          onChange={(event) => setLang(event.target.value as Lang)}
        >
          {LANGS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {/* ProfileForm affiche déjà les objectifs en direct sous les curseurs. */}
      <ProfileForm />

      <button type="button" className="btn" onClick={completeOnboarding}>
        {t('onboarding.start')}
      </button>
    </div>
  )
}
