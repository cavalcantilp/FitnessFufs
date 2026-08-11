import { useApp } from '../state/AppContext'
import { MacroDonut } from './MacroDonut'
import { NumberField } from './NumberField'
import {
  ACTIVITY_FACTORS,
  MACRO_PRESETS,
  MACRO_PRESET_ORDER,
  MACRO_RANGES,
  presetOf,
  type MacroPresetId,
} from '../lib/nutrition'
import { localeOf } from '../lib/date'
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
  const { t, lang, profile, updateProfile, targets } = useApp()
  const preset = presetOf(profile)

  /** Une décimale, avec le séparateur de la langue courante. */
  const gPerKg = (value: number) =>
    value.toLocaleString(localeOf(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  const macros = [
    { key: 'protein', label: t('macro.protein'), grams: targets.protein, kcal: targets.proteinKcal, color: 'var(--protein)' },
    { key: 'fat', label: t('macro.fat'), grams: targets.fat, kcal: targets.fatKcal, color: 'var(--fat)' },
    { key: 'carbs', label: t('macro.carbs'), grams: targets.carbs, kcal: targets.carbsKcal, color: 'var(--carbs)' },
  ]

  return (
    <div className="stack">
      <div className="grid-2">
        <NumberField
          id="p-height"
          label={t('profile.height')}
          value={profile.height}
          min={80}
          max={250}
          onCommit={(height) => updateProfile({ height })}
        />
        <NumberField
          id="p-weight"
          label={t('profile.weight')}
          value={profile.weight}
          min={25}
          max={400}
          inputMode="decimal"
          onCommit={(weight) => updateProfile({ weight })}
        />
      </div>

      <div className="grid-2">
        <NumberField
          id="p-age"
          label={t('profile.age')}
          value={profile.age}
          min={12}
          max={110}
          onCommit={(age) => updateProfile({ age })}
        />
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

      {/* Un programme positionne les deux curseurs ; les bouger repasse en personnalisé. */}
      <div className="field">
        <label htmlFor="p-preset">{t('profile.preset')}</label>
        <select
          id="p-preset"
          value={preset}
          onChange={(event) => {
            const id = event.target.value as MacroPresetId | 'custom'
            if (id !== 'custom') updateProfile(MACRO_PRESETS[id])
          }}
        >
          {MACRO_PRESET_ORDER.map((id) => (
            <option key={id} value={id}>
              {t(`preset.${id}` as TranslationKey)} · {gPerKg(MACRO_PRESETS[id].proteinPerKg)} /{' '}
              {gPerKg(MACRO_PRESETS[id].fatPerKg)} g/kg
            </option>
          ))}
          <option value="custom">{t('preset.custom')}</option>
        </select>
      </div>

      <div className="field">
        <div className="label-row">
          <label htmlFor="p-protein">{t('macro.protein')}</label>
          <span className="val-tag">{gPerKg(profile.proteinPerKg)} g/kg</span>
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
          <span className="val-tag">{gPerKg(profile.fatPerKg)} g/kg</span>
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

      {/*
        Sous le plancher du métabolisme de base, l'objectif ne suit plus les
        réglages : sans ce message, l'application paraît figée. Il vit ici et
        non dans l'onglet Profil pour être visible dès la première ouverture.
      */}
      {targets.belowBmr ? (
        <p className="notice">{t('profile.warnBmr', { n: targets.kcal, req: targets.requestedKcal })}</p>
      ) : null}

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

      {targets.macrosOverflow ? (
        <p className="notice">{t('profile.warnMacros', { n: targets.macrosExcess })}</p>
      ) : null}

      <MacroDonut targets={targets} />

      <p className="hint">{t('profile.carbsAuto')}</p>
    </div>
  )
}
