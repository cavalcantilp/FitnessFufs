import { useApp } from '../state/AppContext'
import { BMI_BANDS, BMI_GAUGE_MAX, BMI_GAUGE_MIN, bmiBand } from '../lib/nutrition'
import type { TranslationKey } from '../i18n/translations'

interface BmiGaugeProps {
  value: number
}

const BAND_COLOR: Record<string, string> = {
  under: 'var(--bmi-under)',
  normal: 'var(--bmi-normal)',
  over: 'var(--bmi-over)',
  obese: 'var(--bmi-obese)',
  morbid: 'var(--bmi-morbid)',
}

/**
 * Barre segmentée par tranche d'IMC plutôt qu'un simple nombre : la
 * flèche montre en un coup d'œil où on se situe, sans avoir à retenir
 * les seuils de chaque catégorie.
 */
export function BmiGauge({ value }: BmiGaugeProps) {
  const { t } = useApp()
  const band = bmiBand(value)
  const clamped = Math.min(Math.max(value, BMI_GAUGE_MIN), BMI_GAUGE_MAX)
  const position = ((clamped - BMI_GAUGE_MIN) / (BMI_GAUGE_MAX - BMI_GAUGE_MIN)) * 100

  return (
    <div className="bmi-gauge">
      <div className="bmi-gauge-value">
        {value}
        <span className="sub">{t(`bmi.${band}` as TranslationKey)}</span>
      </div>
      <div className="bmi-gauge-track">
        <div className="bmi-gauge-segments">
          {BMI_BANDS.map((entry) => (
            <span
              key={entry.band}
              className="bmi-gauge-segment"
              style={{
                width: `${((entry.to - entry.from) / (BMI_GAUGE_MAX - BMI_GAUGE_MIN)) * 100}%`,
                background: BAND_COLOR[entry.band],
              }}
            />
          ))}
        </div>
        <span className="bmi-gauge-pointer" style={{ left: `${position}%` }} aria-hidden="true" />
      </div>
    </div>
  )
}
