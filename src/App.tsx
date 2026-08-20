import { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useApp } from './state/AppContext'
import { Onboarding } from './pages/Onboarding'
import { CalendarScreen } from './pages/CalendarScreen'
import { Diary } from './pages/Diary'
import { AddScreen, type AddView } from './pages/AddScreen'
import { WeightScreen } from './pages/WeightScreen'
import { ProfileScreen } from './pages/ProfileScreen'
import { FridgeScreen } from './pages/FridgeScreen'
import { ChatScreen } from './pages/ChatScreen'
import { ChatButton } from './components/ChatButton'
import { Coachmark } from './components/Coachmark'
import { IconCalendar, IconDiary, IconFridge, IconPlus, IconScale, IconUser } from './components/icons'
import { LANGS } from './i18n/translations'
import { todayKey } from './lib/date'
import { load, save, STORAGE_KEYS } from './lib/storage'
import { defaultMeal } from './lib/meals'
import { TOURS } from './lib/tours'
import type { Lang, MealId } from './lib/types'

type Tab = 'calendar' | 'diary' | 'add' | 'weight' | 'fridge'

export function App() {
  const { t, lang, setLang, onboarded, tutorialsEnabled, tutorialSeen, markTutorialSeen, apiKey } = useApp()
  /**
   * L'onglet et le jour consultés survivent au rechargement : un simple
   * « tirer pour rafraîchir » renvoyait sinon systématiquement au journal
   * du jour, ce qui faisait perdre le fil.
   */
  const [tab, setTab] = useState<Tab>(() => {
    const stored = load(STORAGE_KEYS.ui, { tab: 'diary' as Tab }).tab
    // Le Profil a quitté la barre d'onglets pour l'en-tête : une ancienne
    // session qui l'avait laissé actif retombe sur le journal.
    return (stored as string) === 'profile' ? 'diary' : stored
  })
  const [date, setDate] = useState(() => load(STORAGE_KEYS.ui, { date: todayKey() }).date)
  const [meal, setMeal] = useState<MealId>(() => defaultMeal())
  const [toast, setToast] = useState<string | null>(null)
  const [activeTour, setActiveTour] = useState<string | null>(null)
  /** Sous-écran de l'onglet Ajouter, pour cibler le bon tutoriel (aliment personnalisé, objectif nutritionnel). */
  const [addView, setAddView] = useState<AddView>('list')
  /** Le Profil n'est plus un onglet : un bouton dédié de l'en-tête l'ouvre par-dessus l'onglet courant. */
  const [showProfile, setShowProfile] = useState(false)
  /** L'assistant nutrition, ouvert par le bouton flottant façon WhatsApp. */
  const [showChat, setShowChat] = useState(false)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  // La liste de l'onglet Ajouter partage la visite guidée de l'onglet lui-même ;
  // ses sous-écrans (aliment personnalisé, objectif nutritionnel) ont la leur.
  const tourKey = showProfile
    ? 'profile'
    : tab === 'add' && addView !== 'list'
      ? `add.${addView}`
      : tab

  /**
   * Un léger délai laisse l'onglet finir de se peindre avant de mesurer les
   * éléments ciblés — sans lui, la première visite mesurait parfois un
   * élément pas encore à sa position finale.
   */
  useEffect(() => {
    if (!tutorialsEnabled || tutorialSeen[tourKey] || !TOURS[tourKey]) return
    const timer = window.setTimeout(() => setActiveTour(tourKey), 500)
    return () => window.clearTimeout(timer)
  }, [tourKey, tutorialsEnabled, tutorialSeen])

  const handleTourDone = useCallback(() => {
    markTutorialSeen(tourKey)
    setActiveTour(null)
  }, [tourKey, markTutorialSeen])

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
    { id: 'fridge', label: t('nav.fridge'), icon: <IconFridge /> },
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
        <div className="header-actions">
          {tutorialsEnabled && TOURS[tourKey] ? (
            <button
              type="button"
              className="help-btn"
              onClick={() => setActiveTour(tourKey)}
              aria-label={t('tour.help')}
            >
              ?
            </button>
          ) : null}
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
          <button
            type="button"
            className={`profile-btn${showProfile ? ' active' : ''}`}
            onClick={() => setShowProfile(true)}
            aria-label={t('nav.profile')}
          >
            <IconUser size={18} />
          </button>
        </div>
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

      {showProfile ? (
        <ProfileScreen onToast={setToast} />
      ) : (
        <>
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
            <AddScreen
              date={date}
              meal={meal}
              onAdded={setToast}
              onLogged={() => setTab('diary')}
              onViewChange={setAddView}
            />
          ) : null}
          {tab === 'weight' ? <WeightScreen onToast={setToast} /> : null}
          {tab === 'fridge' ? <FridgeScreen /> : null}
        </>
      )}

      {toast ? <div className="toast">{toast}</div> : null}

      {activeTour ? <Coachmark key={activeTour} steps={TOURS[activeTour]} onDone={handleTourDone} /> : null}

      {!showChat && apiKey.trim() ? <ChatButton onClick={() => setShowChat(true)} /> : null}

      {showChat ? (
        <ChatScreen
          onClose={() => setShowChat(false)}
          onOpenProfile={() => {
            setShowChat(false)
            setShowProfile(true)
          }}
          onToast={setToast}
        />
      ) : null}

      <nav className="tabbar">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={!showProfile && tab === entry.id ? 'active' : ''}
            onClick={() => {
              if (entry.id === 'add') setMeal(defaultMeal())
              setShowProfile(false)
              setTab(entry.id)
            }}
            aria-current={!showProfile && tab === entry.id ? 'page' : undefined}
          >
            {entry.icon}
            {entry.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
