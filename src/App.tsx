import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useApp } from './state/AppContext'
import { Onboarding } from './pages/Onboarding'
import { CalendarScreen } from './pages/CalendarScreen'
import { Diary } from './pages/Diary'
import { AddScreen } from './pages/AddScreen'
import { WeightScreen } from './pages/WeightScreen'
import { ProfileScreen } from './pages/ProfileScreen'
import { IconCalendar, IconDiary, IconPlus, IconScale, IconUser } from './components/icons'
import { LANGS } from './i18n/translations'
import { todayKey } from './lib/date'
import { load, save, STORAGE_KEYS } from './lib/storage'
import { defaultMeal } from './lib/meals'
import type { Lang, MealId } from './lib/types'

type Tab = 'calendar' | 'diary' | 'add' | 'weight' | 'profile'

export function App() {
  const { t, lang, setLang, onboarded } = useApp()
  /**
   * L'onglet et le jour consultés survivent au rechargement : un simple
   * « tirer pour rafraîchir » renvoyait sinon systématiquement au journal
   * du jour, ce qui faisait perdre le fil.
   */
  const [tab, setTab] = useState<Tab>(() => load(STORAGE_KEYS.ui, { tab: 'diary' as Tab }).tab)
  const [date, setDate] = useState(() => load(STORAGE_KEYS.ui, { date: todayKey() }).date)
  const [meal, setMeal] = useState<MealId>(() => defaultMeal())
  const [toast, setToast] = useState<string | null>(null)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  useEffect(() => {
    save(STORAGE_KEYS.ui, { tab, date })
  }, [tab, date])

  // Durée proportionnée au texte : « Ajouté au journal » se lit en deux secondes,
  // une explication d'une ligne et demie non.
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), Math.min(5000, 1600 + toast.length * 45))
    return () => window.clearTimeout(timer)
  }, [toast])

  // Le titre de l'onglet suit la langue choisie.
  useEffect(() => {
    document.title = `${t('app.name')} — ${t('app.tagline')}`
  }, [t])

  if (!onboarded) return <Onboarding />

  // « Ajouter » occupe la position centrale : c'est le geste le plus fréquent.
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'calendar', label: t('nav.calendar'), icon: <IconCalendar /> },
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

      {tab === 'calendar' ? (
        <CalendarScreen
          date={date}
          onPick={(picked) => {
            setDate(picked)
            setTab('diary')
          }}
        />
      ) : null}
      {tab === 'diary' ? (
        <Diary date={date} onDateChange={setDate} onAddTo={openAdd} onToast={setToast} />
      ) : null}
      {tab === 'add' ? (
        <AddScreen date={date} meal={meal} onAdded={setToast} onLogged={() => setTab('diary')} />
      ) : null}
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
