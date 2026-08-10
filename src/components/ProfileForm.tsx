import { useApp } from '../state/AppContext'
import { ACTIVITY_FACTORS, MACRO_SPLITS } from '../lib/nutrition'
import type { ActivityLevel, GoalRate, MacroSplitId, Sex } from '../lib/types'
import type { TranslationKey } from '../i18n/translations'

const GOALS: { rate: GoalRate; key: TranslationKey }[] = [
  { rate: 1.5, key: 'goal.loss150' },
  { rate: 1, key: 'goal.loss100' },
  { rate: 0.75, key: 'goal.loss075' },
  { rate: 0.5, key: 'goal.loss050' },
  { rate: 0.25, key: 'goal.loss025' },
  { rate: 0, key: 'goal.maintain' },
  { rate: -0.25, key: 'goal.gain025' },
  { rate: -0.5, key: 'goal.gain050' },
]

const ACTIVITIES = Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]
const SPLITS: MacroSplitId[] = [...(Object.keys(MACRO_SPLITS) as MacroSplitId[]), 'custom']

/** Champs de profil, partagés entre l'accueil de première utilisation et l'onglet Profil. */
export function ProfileForm() {
  const { t, profile, updateProfile } = useApp()

  const numberField = (value: number, apply: (parsed: number) => void) => (raw: string) => {
    const parsed = Number(raw.replace(',', '.'))
    apply(Number.isFinite(parsed) ? parsed : value)
  }

  const split = profile.customSplit
  const splitTotal = split.protein + split.carbs + split.fat

  return (
    <div className="stack">
      <div className="grid-2">
        <div className="field">
          <label htmlFor="p-height">{t('profile.height')}</label>
          <input
            id="p-height"
            type="number"
            inputMode="numeric"
            min="80"
            max="250"
            value={profile.height}
            onChange={(event) =>
              numberField(profile.height, (height) => updateProfile({ height }))(event.target.value)
            }
          />
        </div>
        <div className="field">
          <label htmlFor="p-weight">{t('profile.weight')}</label>
          <input
            id="p-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="25"
            max="400"
            value={profile.weight}
            onChange={(event) =>
              numberField(profile.weight, (weight) => updateProfile({ weight }))(event.target.value)
            }
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="p-age">{t('profile.age')}</label>
          <input
            id="p-age"
            type="number"
            inputMode="numeric"
            min="12"
            max="110"
            value={profile.age}
            onChange={(event) =>
              numberField(profile.age, (age) => updateProfile({ age }))(event.target.value)
            }
          />
        </div>
        <div className="field">
          <label>{t('profile.sex')}</label>
          <div className="segmented">
            {(['male', 'female'] as Sex[]).map((sex) => (
              <button
                key={sex}
                type="button"
                className={profile.sex === sex ? 'active' : ''}
                onClick={() => updateProfile({ sex })}
              >
                {t(sex === 'male' ? 'profile.male' : 'profile.female')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="p-activity">{t('profile.activity')}</label>
        <select
          id="p-activity"
          value={profile.activity}
          onChange={(event) => updateProfile({ activity: event.target.value as ActivityLevel })}
        >
          {ACTIVITIES.map((level) => (
            <option key={level} value={level}>
              {t(`act.${level}` as TranslationKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="p-goal">{t('profile.goal')}</label>
        <select
          id="p-goal"
          value={profile.goalRate}
          onChange={(event) => updateProfile({ goalRate: Number(event.target.value) as GoalRate })}
        >
          {GOALS.map((goal) => (
            <option key={goal.rate} value={goal.rate}>
              {t(goal.key)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="p-split">{t('profile.split')}</label>
        <select
          id="p-split"
          value={profile.splitId}
          onChange={(event) => updateProfile({ splitId: event.target.value as MacroSplitId })}
        >
          {SPLITS.map((id) => (
            <option key={id} value={id}>
              {t(`split.${id}` as TranslationKey)}
            </option>
          ))}
        </select>
      </div>

      {profile.splitId === 'custom' ? (
        <>
          <div className="grid-3">
            {(['protein', 'carbs', 'fat'] as const).map((macro) => (
              <div className="field" key={macro}>
                <label htmlFor={`p-${macro}`}>{t(`macro.${macro}` as TranslationKey)}</label>
                <input
                  id={`p-${macro}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  value={split[macro]}
                  onChange={(event) => {
                    const parsed = Number(event.target.value)
                    updateProfile({
                      customSplit: {
                        ...split,
                        [macro]: Number.isFinite(parsed) ? parsed : split[macro],
                      },
                    })
                  }}
                />
              </div>
            ))}
          </div>
          {splitTotal !== 100 ? (
            <p className="notice">{t('profile.splitTotal', { n: splitTotal })}</p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
