import { useRef, useState } from 'react'
import { IconComment } from './icons'

/** Durée de la pression requise pour ouvrir le journal du jour. */
const HOLD_MS = 750
/** Au-delà de ce déplacement, on considère que le doigt balaie le mois plutôt qu'il ne presse ce jour. */
const MOVE_CANCEL_PX = 16

export interface CalendarDayBar {
  key: string
  /** Sens de l'écart par rapport à l'objectif : la barre part du centre. */
  side: 'over' | 'under'
  /** 0 à 50, déjà plafonné : la moitié de la piste représente 50 % d'écart. */
  width: number
  /** Couleur selon l'ampleur de l'écart, pas selon la macro. */
  color: string
  /** Couleur d'identité de la ligne (calories, protéines, glucides, lipides). */
  dotColor: string
}

interface CalendarDayProps {
  date: string
  dayNumber: number
  outside: boolean
  selected: boolean
  isToday: boolean
  /** Absentes quand le jour n'a aucune saisie : pas de barres à zéro sans raison. */
  bars: CalendarDayBar[] | null
  onTrack: boolean
  onTarget: boolean
  hasNote: boolean
  /** Pression maintenue 750 ms : ouvre le journal de ce jour. */
  onOpen: (date: string) => void
  /** Pression brève : déplace seulement le contour, sans autre effet. */
  onSelect: (date: string) => void
}

/**
 * Une pression brève ne fait que déplacer le contour — aucune fenêtre, aucun
 * clavier, une simple pression ne doit surprendre personne. Rester appuyé
 * 750 ms ouvre le journal du jour ; un anneau de progression comble
 * l'attente, sans quoi une pression prolongée sans aucun retour visuel
 * se lit comme une application qui ne répond plus. La note du jour, elle, se
 * consulte et se modifie depuis le journal, pas depuis le calendrier.
 */
export function CalendarDay({
  date,
  dayNumber,
  outside,
  selected,
  isToday,
  bars,
  onTrack,
  onTarget,
  hasNote,
  onOpen,
  onSelect,
}: CalendarDayProps) {
  const [pressing, setPressing] = useState(false)
  const timer = useRef<number | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  const arm = (x: number, y: number) => {
    fired.current = false
    origin.current = { x, y }
    setPressing(true)
    clearTimer()
    timer.current = window.setTimeout(() => {
      fired.current = true
      setPressing(false)
      onOpen(date)
    }, HOLD_MS)
  }

  const disarm = () => {
    clearTimer()
    origin.current = null
    setPressing(false)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    // Évite le focus/surlignage que certains navigateurs appliquent par
    // défaut à un bouton pressé, hors de propos pour une simple sélection.
    event.preventDefault()
    arm(event.clientX, event.clientY)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!origin.current) return
    const dx = event.clientX - origin.current.x
    const dy = event.clientY - origin.current.y
    // Le doigt a glissé : ce n'est plus une pression sur ce jour mais
    // vraisemblablement un balayage de mois, qu'on laisse le parent traiter.
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) disarm()
  }

  const onPointerUp = () => {
    const wasArmed = origin.current !== null
    const alreadyFired = fired.current
    disarm()
    if (wasArmed && !alreadyFired) onSelect(date)
  }

  const classes = [
    'calendar-day',
    outside ? 'outside' : '',
    isToday ? 'today' : '',
    onTarget ? 'on-target' : onTrack ? 'on-track' : '',
    selected ? 'selected' : '',
    pressing ? 'pressing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={disarm}
      onContextMenu={(event) => event.preventDefault()}
      aria-current={isToday ? 'date' : undefined}
    >
      <span className="hold-ring" aria-hidden="true" />
      <span className="day-top">
        <span className="num">{dayNumber}</span>
        {hasNote ? <IconComment size={11} /> : null}
      </span>
      {bars ? (
        <span className="day-bars">
          {bars.map((bar) => (
            <span className="sbar-row" key={bar.key}>
              <span className="row-dot" style={{ background: bar.dotColor }} />
              <span className="sbar">
                <span className="tick" />
                <span className={`fill ${bar.side}`} style={{ width: `${bar.width}%`, background: bar.color }} />
              </span>
            </span>
          ))}
        </span>
      ) : null}
    </button>
  )
}
