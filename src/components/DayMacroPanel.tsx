import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { MacroSliders } from './MacroSliders'
import { IconChevronDown } from './icons'
import type { Targets } from '../lib/nutrition'

interface DayMacroPanelProps {
  date: string
  /** Objectifs déjà calculés pour ce jour, personnalisation comprise. */
  targets: Targets
}

/**
 * Répartition d'une seule journée, repliée derrière une flèche. Un jour
 * d'entraînement ne demande pas la même chose qu'un jour de repos, mais la
 * plupart des journées suivent le profil : le panneau reste donc fermé, sauf
 * si le profil demande le contraire.
 */
export function DayMacroPanel({ date, targets }: DayMacroPanelProps) {
  const { t, profile, dayMacros, setDayMacrosFor, clearDayMacros } = useApp()
  const custom = dayMacros[date]
  // Une journée déjà personnalisée s'ouvre d'office : la cacher masquerait
  // pourquoi ses objectifs diffèrent de ceux du profil.
  const [open, setOpen] = useState(() => profile.dayMacrosOpen || custom !== undefined)

  const current = custom ?? { proteinPerKg: profile.proteinPerKg, fatPerKg: profile.fatPerKg }

  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure-head"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>
          {t('day.macros')}
          {custom ? <span className="tag">{t('day.custom')}</span> : null}
        </span>
        <IconChevronDown open={open} />
      </button>

      {open ? (
        <div className="disclosure-body stack">
          <MacroSliders idPrefix="d" value={current} onChange={(next) => setDayMacrosFor(date, next)} />

          <div className="macro-grid">
            <div className="macro-card">
              <div className="macro-title">{t('macro.protein')}</div>
              <div className="macro-value" style={{ color: 'var(--protein)' }}>
                {targets.protein} g
              </div>
            </div>
            <div className="macro-card">
              <div className="macro-title">{t('macro.fat')}</div>
              <div className="macro-value" style={{ color: 'var(--fat)' }}>
                {targets.fat} g
              </div>
            </div>
            <div className="macro-card">
              <div className="macro-title">{t('macro.carbs')}</div>
              <div className="macro-value" style={{ color: 'var(--carbs)' }}>
                {targets.carbs} g
              </div>
            </div>
          </div>

          {targets.macrosOverflow ? (
            <p className="notice">{t('profile.warnMacros', { n: targets.macrosExcess })}</p>
          ) : null}

          {custom ? (
            <button type="button" className="btn secondary" onClick={() => clearDayMacros(date)}>
              {t('day.reset')}
            </button>
          ) : (
            <p className="hint">{t('day.followsProfile')}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
