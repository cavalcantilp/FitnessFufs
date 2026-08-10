import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useApp } from './state/AppContext'
import { Onboarding } from './pages/Onboarding'
import { Diary } from './pages/Diary'
import { AddScreen } from './pages/AddScreen'
import { WeightScreen } from './pages/WeightScreen'
import { ProfileScreen } from './pages/ProfileScreen'
import { IconDiary, IconPlus, IconScale, IconUser } from './components/icons'
import { LANGS } from './i18n/translations'
import { todayKey } from './lib/date'
import { defaultMeal } from './lib/meals'
import type { Lang, MealId } from './lib/types'

type Tab = 'diary' | 'add' | 'weight' | 'profile'

export function App() {
  const { t, lang, setLang, onboarded } = useApp()
  const [tab, setTab] = useState<Tab>('diary')
  const [date, setDate] = useState(todayKey())
  const [meal, setMeal] = useState<MealId>(() => defaultMeal())
  const [toast, setToast] = useState<string | null>(null)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2000)
    return () => window.clearTimeout(timer)
  }, [toast])

  // Le titre de l'onglet suit la langue choisie.
  useEffect(() => {
    document.title = `${t('app.name')} — ${t('app.tagline')}`
  }, [t])

  if (!onboarded) return <Onboarding />

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'diary', label: t('nav.diary'), icon: <IconDiary /> },
    { id: 'add', label: t('nav.add'), icon: <IconPlus /> },
    { id: 'weight', label: t('nav.weight'), icon: <IconScale /> },
    { id: 'profile', label: t('nav.profile'), icon: <IconUser /> },
  ]

  const openAdd = (target: MealId) => {
    setMeal(target)
    setTab('add')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{t('app.name')}</h1>
          <span className="subtitle">{t('app.tagline')}</span>
        </div>
        <select
          className="lang-select"
          value={lang}
          onChange={(event) => setLang(event.target.value as Lang)}
          aria-label={t('profile.language')}
        >
          {LANGS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </header>

      {needRefresh ? (
        <div style={{ padding: '0 16px' }}>
          <button
            type="button"
            className="notice info"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => void updateServiceWorker(true)}
          >
            {t('common.update')} — {t('common.refresh')}
          </button>
        </div>
      ) : null}

      {tab === 'diary' ? (
        <Diary date={date} onDateChange={setDate} onAddTo={openAdd} onToast={setToast} />
      ) : null}
      {tab === 'add' ? <AddScreen date={date} meal={meal} onAdded={setToast} /> : null}
      {tab === 'weight' ? <WeightScreen onToast={setToast} /> : null}
      {tab === 'profile' ? <ProfileScreen onToast={setToast} /> : null}

      {toast ? <div className="toast">{toast}</div> : null}

      <nav className="tabbar">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={tab === entry.id ? 'active' : ''}
            onClick={() => {
              if (entry.id === 'add') setMeal(defaultMeal())
              setTab(entry.id)
            }}
            aria-current={tab === entry.id ? 'page' : undefined}
          >
            {entry.icon}
            {entry.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
