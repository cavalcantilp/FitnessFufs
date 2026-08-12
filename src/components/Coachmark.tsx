import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import type { TranslationKey } from '../i18n/translations'

export interface CoachStep {
  /** Sélecteur CSS de l'élément à mettre en évidence. */
  target: string
  textKey: TranslationKey
}

interface CoachmarkProps {
  steps: CoachStep[]
  onDone: () => void
}

const PAD = 8

/**
 * Visite guidée d'un onglet : encadre l'élément ciblé par sélecteur CSS et
 * affiche une bulle d'explication à côté. Une étape dont la cible est absente
 * de l'écran (liste vide, section repliée...) est sautée automatiquement
 * plutôt que de bloquer la visite.
 */
export function Coachmark({ steps, onDone }: CoachmarkProps) {
  const { t } = useApp()
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (index >= steps.length) {
      onDone()
      return
    }
    const el = document.querySelector(steps[index].target)
    if (!el) {
      setIndex((current) => current + 1)
      return
    }
    // Défilement instantané, pas « smooth » : un défilement animé laissait
    // passer un rectangle mesuré avant la fin de l'animation — le repère
    // apparaissait figé à l'ancienne position de défilement d'un onglet
    // précédent le temps que les évènements « scroll » le rattrapent.
    el.scrollIntoView({ block: 'center' })
    const update = () => setRect(el.getBoundingClientRect())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [index, steps, onDone])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDone()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onDone])

  if (index >= steps.length || !rect) return null

  const last = index === steps.length - 1
  const placeAbove = window.innerHeight - rect.bottom < 220 && rect.top > 220

  return (
    <div className="coach-overlay" role="presentation" onClick={onDone}>
      <div
        className="coach-highlight"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }}
      />
      <div
        className="coach-tooltip"
        style={placeAbove ? { bottom: window.innerHeight - rect.top + PAD } : { top: rect.bottom + PAD }}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <p>{t(steps[index].textKey)}</p>
        <div className="coach-tooltip-actions">
          <span className="coach-step-count">
            {index + 1}/{steps.length}
          </span>
          <div className="coach-tooltip-buttons">
            {!last ? (
              <button type="button" className="coach-skip" onClick={onDone}>
                {t('tour.skip')}
              </button>
            ) : null}
            <button
              type="button"
              className="coach-next"
              onClick={() => setIndex((current) => current + 1)}
            >
              {last ? t('tour.done') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
