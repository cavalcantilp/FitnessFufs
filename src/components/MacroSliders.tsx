import { useApp } from '../state/AppContext'
import { localeOf } from '../lib/date'
import {
  MACRO_PRESETS,
  MACRO_PRESET_ORDER,
  MACRO_RANGES,
  presetOf,
  type MacroPreset,
  type MacroPresetId,
} from '../lib/nutrition'
import type { TranslationKey } from '../i18n/translations'

interface MacroSlidersProps {
  value: MacroPreset
  onChange: (macros: MacroPreset) => void
  /** Distingue les champs du profil de ceux d'une journée sur le même écran. */
  idPrefix: string
}

/**
 * Programme et deux curseurs en grammes par kilo de poids de corps, partagés
 * par le profil et par la personnalisation d'une journée : le geste doit être
 * le même aux deux endroits.
 */
export function MacroSliders({ value, onChange, idPrefix }: MacroSlidersProps) {
  const { t, lang } = useApp()
  const preset = presetOf(value)

  /** Une décimale, avec le séparateur de la langue courante. */
  const gPerKg = (n: number) =>
    n.toLocaleString(localeOf(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <>
      {/* Un programme positionne les deux curseurs ; les bouger repasse en personnalisé. */}
      <div className="field">
        <label htmlFor={`${idPrefix}-preset`}>{t('profile.preset')}</label>
        <select
          id={`${idPrefix}-preset`}
          value={preset}
          onChange={(event) => {
            const id = event.target.value as MacroPresetId | 'custom'
            if (id !== 'custom') onChange(MACRO_PRESETS[id])
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
          <label htmlFor={`${idPrefix}-protein`}>{t('macro.protein')}</label>
          <span className="val-tag">{gPerKg(value.proteinPerKg)} g/kg</span>
        </div>
        <input
          id={`${idPrefix}-protein`}
          type="range"
          min={MACRO_RANGES.protein.min}
          max={MACRO_RANGES.protein.max}
          step={MACRO_RANGES.protein.step}
          value={value.proteinPerKg}
          onChange={(event) => onChange({ ...value, proteinPerKg: Number(event.target.value) })}
        />
      </div>

      <div className="field">
        <div className="label-row">
          <label htmlFor={`${idPrefix}-fat`}>{t('macro.fat')}</label>
          <span className="val-tag">{gPerKg(value.fatPerKg)} g/kg</span>
        </div>
        <input
          id={`${idPrefix}-fat`}
          type="range"
          min={MACRO_RANGES.fat.min}
          max={MACRO_RANGES.fat.max}
          step={MACRO_RANGES.fat.step}
          value={value.fatPerKg}
          onChange={(event) => onChange({ ...value, fatPerKg: Number(event.target.value) })}
        />
      </div>
    </>
  )
}
