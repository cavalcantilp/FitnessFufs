import { useMemo, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { CalendarDay, type CalendarDayBar } from '../components/CalendarDay'
import { DayNoteSheet } from '../components/DayNoteSheet'
import { IconChevronLeft, IconChevronRight, IconFlame } from '../components/icons'
import { fromKey, localeOf, shiftDay, toKey, todayKey } from '../lib/date'
import { sumNutrients, withinTolerance } from '../lib/nutrition'
import type { DiaryEntry } from '../lib/types'

interface CalendarScreenProps {
  /** Jour actuellement ouvert dans le journal. */
  date: string
  onPick: (date: string) => void
}

/** Lundi en tête : la semaine commence ainsi dans les cinq langues visées. */
function startOfGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1)
  const weekday = (first.getDay() + 6) % 7
  first.setDate(first.getDate() - weekday)
  return first
}

export function CalendarScreen({ date, onPick }: CalendarScreenProps) {
  const { t, lang, entries, targetsFor, notes } = useApp()
  const today = todayKey()
  const [cursor, setCursor] = useState(() => {
    const current = fromKey(date)
    return { year: current.getFullYear(), month: current.getMonth() }
  })
  const [noteDate, setNoteDate] = useState<string | null>(null)
  /**
   * Jour entouré. Une pression brève n'ouvre plus le journal — elle ouvre la
   * note — donc `date` (le jour du journal, propriété du parent) ne bouge
   * plus au toucher : sans cet état local, le contour restait figé sur le
   * dernier jour ouvert par une pression longue, sans jamais suivre le doigt.
   */
  const [viewed, setViewed] = useState(date)

  const openNote = (key: string) => {
    setViewed(key)
    setNoteDate(key)
  }

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>()
    entries.forEach((entry) => {
      const list = map.get(entry.date)
      if (list) list.push(entry)
      else map.set(entry.date, [entry])
    })
    return map
  }, [entries])

  /**
   * Série en cours : nombre de jours consécutifs, en remontant depuis
   * aujourd'hui, où l'objectif calorique est respecté à 10 % près, et série
   * distincte où calories et les trois macros le sont toutes. Un jour sans
   * aucune saisie arrête les deux séries — le silence n'est pas un résultat.
   * Aujourd'hui n'est ignoré que s'il est encore entièrement vide : une
   * journée en cours ne doit pas casser la série de la veille.
   */
  const { calorieStreak, macroStreak } = useMemo(() => {
    let cursorDate = entriesByDate.get(today)?.length ? today : shiftDay(today, -1)
    let calories = 0
    let macros = 0
    let calorieBroken = false
    let macroBroken = false

    // Borne large mais finie : au-delà d'un an, la série n'a plus grand sens
    // à afficher, et cela évite toute boucle sans fin sur un historique ancien.
    for (let i = 0; i < 366; i++) {
      const dayEntries = entriesByDate.get(cursorDate)
      if (!dayEntries || dayEntries.length === 0) break

      const eaten = sumNutrients(dayEntries.map((entry) => entry.nutrients))
      const goal = targetsFor(cursorDate)
      const calOk = withinTolerance(eaten.kcal, goal.kcal)
      const macroOk =
        calOk &&
        withinTolerance(eaten.protein, goal.protein) &&
        withinTolerance(eaten.carbs, goal.carbs) &&
        withinTolerance(eaten.fat, goal.fat)

      if (!calorieBroken) {
        if (calOk) calories += 1
        else calorieBroken = true
      }
      if (!macroBroken) {
        if (macroOk) macros += 1
        else macroBroken = true
      }
      if (calorieBroken && macroBroken) break
      cursorDate = shiftDay(cursorDate, -1)
    }

    return { calorieStreak: calories, macroStreak: macros }
  }, [entriesByDate, targetsFor, today])

  /**
   * Cinq ou six semaines selon le mois : afficher une sixième ligne entièrement
   * hors mois gaspillerait un sixième de la page maintenant qu'elle est pleine.
   */
  const { days, weeks } = useMemo(() => {
    const start = startOfGrid(cursor.year, cursor.month)
    const lead = Math.round((new Date(cursor.year, cursor.month, 1).getTime() - start.getTime()) / 86400000)
    const length = Math.ceil((lead + new Date(cursor.year, cursor.month + 1, 0).getDate()) / 7)
    return {
      weeks: length,
      days: Array.from({ length: length * 7 }, (_, index) => {
        const day = new Date(start)
        day.setDate(start.getDate() + index)
        return day
      }),
    }
  }, [cursor])

  const locale = localeOf(lang)
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  // Initiales des jours tirées de la locale plutôt que traduites à la main.
  const weekdays = useMemo(() => {
    const reference = startOfGrid(2024, 0)
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(reference)
      day.setDate(reference.getDate() + index)
      return day.toLocaleDateString(locale, { weekday: 'narrow' })
    })
  }, [locale])

  const shiftMonth = (delta: number) => {
    setCursor((current) => {
      const moved = new Date(current.year, current.month + delta, 1)
      return { year: moved.getFullYear(), month: moved.getMonth() }
    })
  }

  /**
   * Balayage horizontal pour changer de mois. Le geste n'est retenu que s'il
   * est franchement horizontal : sinon on confisquerait le défilement vertical
   * de la page à la moindre inclinaison du pouce.
   */
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    swipe.current = { x: touch.clientX, y: touch.clientY }
  }
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    shiftMonth(dx < 0 ? 1 : -1)
  }

  return (
    <div className="screen calendar-screen">
      <div className="day-nav">
        <button type="button" className="arrow" onClick={() => shiftMonth(-1)} aria-label={monthLabel}>
          <IconChevronLeft />
        </button>
        <div className="label" style={{ textTransform: 'capitalize' }}>
          {monthLabel}
        </div>
        <button type="button" className="arrow" onClick={() => shiftMonth(1)} aria-label={monthLabel}>
          <IconChevronRight />
        </button>
      </div>

      <div className="calendar" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="calendar-weekdays">
          {weekdays.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>

        <div className="calendar-grid" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
          {days.map((day) => {
            const key = toKey(day)
            const dayEntries = entriesByDate.get(key)
            const goal = dayEntries?.length ? targetsFor(key) : null
            const eaten = dayEntries?.length ? sumNutrients(dayEntries.map((entry) => entry.nutrients)) : null

            const bars: CalendarDayBar[] | null =
              eaten && goal
                ? [
                    { key: 'kcal', pct: goal.kcal > 0 ? Math.min(100, (eaten.kcal / goal.kcal) * 100) : 0, color: 'var(--calendar-kcal)' },
                    { key: 'protein', pct: goal.protein > 0 ? Math.min(100, (eaten.protein / goal.protein) * 100) : 0, color: 'var(--protein)' },
                    { key: 'carbs', pct: goal.carbs > 0 ? Math.min(100, (eaten.carbs / goal.carbs) * 100) : 0, color: 'var(--carbs)' },
                    { key: 'fat', pct: goal.fat > 0 ? Math.min(100, (eaten.fat / goal.fat) * 100) : 0, color: 'var(--fat)' },
                  ]
                : null

            const calOk = eaten && goal ? withinTolerance(eaten.kcal, goal.kcal) : false
            const macroOk =
              calOk && eaten && goal
                ? withinTolerance(eaten.protein, goal.protein) &&
                  withinTolerance(eaten.carbs, goal.carbs) &&
                  withinTolerance(eaten.fat, goal.fat)
                : false

            return (
              <CalendarDay
                key={key}
                date={key}
                dayNumber={day.getDate()}
                outside={day.getMonth() !== cursor.month}
                selected={key === viewed}
                isToday={key === today}
                bars={bars}
                onTrack={calOk}
                onTarget={macroOk}
                hasNote={Boolean(notes[key])}
                onOpen={onPick}
                onNote={openNote}
              />
            )
          })}
        </div>
      </div>

      <div className="calendar-footer">
        <div className="calendar-streaks">
          <span className="streak" aria-label={`${calorieStreak} ${t('calendar.streakCalories')}`}>
            <IconFlame size={14} />
            <strong>{calorieStreak}</strong>
            <span className="streak-label">{t('calendar.streakCalories')}</span>
          </span>
          <span className="streak" aria-label={`${macroStreak} ${t('calendar.streakMacros')}`}>
            <IconFlame size={14} />
            <strong>{macroStreak}</strong>
            <span className="streak-label">{t('calendar.streakMacros')}</span>
          </span>
        </div>
        <button type="button" className="today-btn" onClick={() => onPick(today)}>
          {t('diary.today')}
        </button>
      </div>

      {noteDate ? <DayNoteSheet date={noteDate} onClose={() => setNoteDate(null)} /> : null}
    </div>
  )
}
