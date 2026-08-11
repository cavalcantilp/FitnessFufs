import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { IconChevronDown } from './icons'
import { MICRO_IS_LIMIT, MICRO_KEYS, MICRO_REFERENCE, MICRO_UNITS } from '../lib/nutrition'
import type { TranslationKey } from '../i18n/translations'
import type { Micros } from '../lib/types'

interface MicroPanelProps {
  /** Valeurs à afficher, ou null quand l'aliment n'est pas renseigné. */
  micros: Micros | null
  /**
   * Part des calories couvertes par des aliments renseignés, en pourcentage.
   * Fournie pour un total de journée ; omise pour un aliment seul.
   */
  coverage?: number
}

/** Une décimale en dessous de 10, entier au-dessus : « 0,4 mg » mais « 316 mg ». */
function display(value: number): string {
  if (value >= 100) return String(Math.round(value))
  if (value >= 10) return String(Math.round(value * 10) / 10)
  return String(Math.round(value * 100) / 100)
}

/**
 * Micronutriments repliés derrière une flèche : ils intéressent rarement au
 * moment de la saisie, mais doivent rester consultables sans quitter l'écran.
 */
export function MicroPanel({ micros, coverage }: MicroPanelProps) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure-head"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>{t('micros.title')}</span>
        <IconChevronDown open={open} />
      </button>

      {open ? (
        micros ? (
          <div className="disclosure-body">
            {MICRO_KEYS.map((key) => {
              const value = micros[key]
              const share = Math.round((value / MICRO_REFERENCE[key]) * 100)
              // Le sodium se lit comme un plafond : au-delà de 100 % il alerte.
              const over = MICRO_IS_LIMIT[key] && share > 100
              return (
                <div className="micro-row" key={key}>
                  <span className="name">{t(`micro.${key}` as TranslationKey)}</span>
                  <span className="value">
                    {display(value)} {MICRO_UNITS[key]}
                  </span>
                  <span className={`share${over ? ' over' : ''}`}>{share} %</span>
                </div>
              )
            })}
            <p className="hint">% {t('micros.reference')}</p>
            {coverage !== undefined && coverage < 100 ? (
              <p className="notice">{t('micros.partial', { n: coverage })}</p>
            ) : null}
          </div>
        ) : (
          <div className="disclosure-body">
            <p className="hint">{t('micros.none')}</p>
          </div>
        )
      ) : null}
    </div>
  )
}
