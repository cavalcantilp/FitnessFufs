import { useRef, useState } from 'react'
import { IconComment } from './icons'

/** Durée de la pression requise pour ouvrir le journal du jour. */
const HOLD_MS = 3000
/** Au-delà de ce déplacement, on considère que le doigt balaie le mois plutôt qu'il ne presse ce jour. */
const MOVE_CANCEL_PX = 16

export interface CalendarDayBar {
  key: string
  /** 0 à 100, déjà plafonné à l'objectif. */
  pct: number
  color: string
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
  /** Pression maintenue 3 secondes : ouvre le journal de ce jour. */
  onOpen: (date: string) => void
  /** Pression brève : ouvre la note du jour. */
  onNote: (date: string) => void
}

/**
 * Une pression brève ouvrait autrefois directement le journal ; elle ouvre
 * désormais la note du jour, geste devenu au moins aussi fréquent que la
 * simple consultation. Rester appuyé 3 secondes ouvre le journal — un anneau
 * de progression comble l'attente, sans quoi une pression de 3 secondes sans
 * aucun retour visuel se lit comme une application qui ne répond plus.
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
  onNote,
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
    // Sans ceci, le clic de compatibilité que le navigateur synthétise après
    // le relâchement rendait ensuite le focus au bouton — juste après que la
    // note ouverte l'ait donné à son champ de texte, ce qui refermait le
    // clavier aussitôt ouvert.
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
    if (wasArmed && !alreadyFired) onNote(date)
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
            <span className="day-bar" key={bar.key}>
              <span className="fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
            </span>
          ))}
        </span>
      ) : null}
    </button>
  )
}
