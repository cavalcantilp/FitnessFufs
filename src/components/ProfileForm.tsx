import { useApp } from '../state/AppContext'
import { MacroDonut } from './MacroDonut'
import { ACTIVITY_FACTORS, MACRO_RANGES } from '../lib/nutrition'
import type { ActivityLevel, GoalRate, Sex } from '../lib/types'
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

/** Champs de profil, partagés entre l'accueil de première utilisation et l'onglet Profil. */
export function ProfileForm() {
  const { t, profile, updateProfile, targets } = useApp()

  const numberField = (value: number, apply: (parsed: number) => void) => (raw: string) => {
    const parsed = Number(raw.replace(',', '.'))
    apply(Number.isFinite(parsed) ? parsed : value)
  }

  const macros = [
    { key: 'protein', label: t('macro.protein'), grams: targets.protein, kcal: targets.proteinKcal, color: 'var(--protein)' },
    { key: 'fat', label: t('macro.fat'), grams: targets.fat, kcal: targets.fatKcal, color: 'var(--fat)' },
    { key: 'carbs', label: t('macro.carbs'), grams: targets.carbs, kcal: targets.carbsKcal, color: 'var(--carbs)' },
  ]

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

      {/* Protéines et lipides au curseur, en g/kg ; les glucides suivent. */}
      <div className="field">
        <div className="label-row">
          <label htmlFor="p-protein">{t('macro.protein')}</label>
          <span className="val-tag">{profile.proteinPerKg.toFixed(1)} g/kg</span>
        </div>
        <input
          id="p-protein"
          type="range"
          min={MACRO_RANGES.protein.min}
          max={MACRO_RANGES.protein.max}
          step={MACRO_RANGES.protein.step}
          value={profile.proteinPerKg}
          onChange={(event) => updateProfile({ proteinPerKg: Number(event.target.value) })}
        />
      </div>

      <div className="field">
        <div className="label-row">
          <label htmlFor="p-fat">{t('macro.fat')}</label>
          <span className="val-tag">{profile.fatPerKg.toFixed(1)} g/kg</span>
        </div>
        <input
          id="p-fat"
          type="range"
          min={MACRO_RANGES.fat.min}
          max={MACRO_RANGES.fat.max}
          step={MACRO_RANGES.fat.step}
          value={profile.fatPerKg}
          onChange={(event) => updateProfile({ fatPerKg: Number(event.target.value) })}
        />
      </div>

      <div className="macro-grid">
        {macros.map((macro) => (
          <div className="macro-card" key={macro.key}>
            <div className="macro-title">{macro.label}</div>
            <div className="macro-value" style={{ color: macro.color }}>
              {macro.grams} g
            </div>
            <div className="macro-sub">{macro.kcal} kcal</div>
          </div>
        ))}
      </div>

      {targets.macrosOverflow ? <p className="notice">{t('profile.warnMacros')}</p> : null}

      <MacroDonut targets={targets} />

      <p className="hint">{t('profile.carbsAuto')}</p>
    </div>
  )
}
