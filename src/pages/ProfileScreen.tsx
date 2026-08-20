import { useRef } from 'react'
import { useApp } from '../state/AppContext'
import { ProfileForm } from '../components/ProfileForm'

interface ProfileScreenProps {
  onToast: (message: string) => void
}

export function ProfileScreen({ onToast }: ProfileScreenProps) {
  const { t, targets, exportData, importData, resetAll, tutorialsEnabled, setTutorialsEnabled, apiKey, setApiKey } =
    useApp()
  const fileInput = useRef<HTMLInputElement>(null)

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fitnessfufs-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File) => {
    try {
      const ok = importData(JSON.parse(await file.text()))
      onToast(ok ? t('profile.imported') : t('profile.importError'))
    } catch {
      onToast(t('profile.importError'))
    }
  }

  return (
    <div className="screen">
      <div className="card">
        <div className="card-title">{t('profile.title')}</div>
        <ProfileForm />
      </div>

      <div className="card">
        <div className="card-title">{t('profile.targets')}</div>
        {/* Les macros sont détaillées au-dessus, sous les curseurs : ici, l'énergétique. */}
        <div className="stack" style={{ gap: 10 }}>
          <div className="figure-row">
            <span className="name">{t('macro.kcal')}</span>
            <span className="value">{targets.kcal} kcal</span>
          </div>
          {/* Quand le plancher s'applique, la ligne retenue ne bouge plus : celle-ci si. */}
          {targets.belowBmr ? (
            <div className="figure-row">
              <span className="name">{t('profile.requested')}</span>
              <span className="value">{targets.requestedKcal} kcal</span>
            </div>
          ) : null}
          <div className="figure-row">
            <span className="name">{t('profile.bmr')}</span>
            <span className="value">{targets.bmr} kcal</span>
          </div>
          <div className="figure-row">
            <span className="name">{t('profile.tdee')}</span>
            <span className="value">{targets.tdee} kcal</span>
          </div>
          <div className="figure-row">
            <span className="name">{t('profile.adjustment')}</span>
            <span className="value">
              {targets.adjustment === 0
                ? t('common.none')
                : `${targets.adjustment > 0 ? '+' : ''}${targets.adjustment} kcal`}
            </span>
          </div>
        </div>
        {/* L'explication du plancher est donnée sous les curseurs, avec les macros. */}
      </div>

      <div className="card stack">
        <div className="card-title">{t('chat.title')}</div>
        <p className="hint">{t('profile.apiKeyHint')}</p>
        <div className="field">
          <label htmlFor="api-key">{t('profile.apiKey')}</label>
          <input
            id="api-key"
            name="api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="AIzaSy…"
          />
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">{t('profile.data')}</div>
        <p className="hint">{t('profile.offline')}</p>
        <label className="check-row" id="tutorials-toggle">
          <input
            type="checkbox"
            checked={tutorialsEnabled}
            onChange={(event) => setTutorialsEnabled(event.target.checked)}
          />
          <span>
            {t('profile.tutorials')}
            <span className="hint">{t('profile.tutorialsHint')}</span>
          </span>
        </label>
        <button type="button" className="btn secondary" onClick={download}>
          {t('profile.export')}
        </button>
        <button type="button" className="btn secondary" onClick={() => fileInput.current?.click()}>
          {t('profile.import')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ''
          }}
        />
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (window.confirm(t('profile.resetConfirm'))) resetAll()
          }}
        >
          {t('profile.reset')}
        </button>
      </div>
    </div>
  )
}
