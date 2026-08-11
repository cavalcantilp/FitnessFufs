import { useMemo, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { IconChevronLeft, IconChevronRight } from '../components/icons'
import { fromKey, localeOf, toKey, todayKey } from '../lib/date'
import { MEALS } from '../lib/meals'
import type { MealId } from '../lib/types'

interface CalendarScreenProps {
  /** Jour actuellement ouvert dans le journal. */
  date: string
  onPick: (date: string) => void
}

/** Une couleur par repas, distincte de celles des macros pour éviter la confusion. */
const MEAL_COLORS: Record<MealId, string> = {
  breakfast: 'var(--meal-breakfast)',
  lunch: 'var(--meal-lunch)',
  dinner: 'var(--meal-dinner)',
  snack: 'var(--meal-snack)',
}

/** Lundi en tête : la semaine commence ainsi dans les cinq langues visées. */
function startOfGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1)
  const weekday = (first.getDay() + 6) % 7
  first.setDate(first.getDate() - weekday)
  return first
}

export function CalendarScreen({ date, onPick }: CalendarScreenProps) {
  const { t, lang, entries } = useApp()
  const today = todayKey()
  const [cursor, setCursor] = useState(() => {
    const current = fromKey(date)
    return { year: current.getFullYear(), month: current.getMonth() }
  })

  /**
   * Repas renseignés par jour. Une barre par repas plutôt qu'un simple point :
   * on voit d'un coup d'œil les journées complètes et celles où un repas manque.
   */
  const mealsByDay = useMemo(() => {
    const map = new Map<string, Set<MealId>>()
    entries.forEach((entry) => {
      const set = map.get(entry.date) ?? new Set<MealId>()
      set.add(entry.meal)
      map.set(entry.date, set)
    })
    return map
  }, [entries])

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
            const meals = mealsByDay.get(key)
            const classes = [
              'calendar-day',
              day.getMonth() !== cursor.month ? 'outside' : '',
              key === date ? 'selected' : '',
              key === today ? 'today' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                type="button"
                key={key}
                className={classes}
                onClick={() => onPick(key)}
                aria-current={key === today ? 'date' : undefined}
              >
                <span className="num">{day.getDate()}</span>
                <span className="bars">
                  {MEALS.filter((meal) => meals?.has(meal)).map((meal) => (
                    <span key={meal} className="bar" style={{ background: MEAL_COLORS[meal] }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="calendar-footer">
        <div className="calendar-legend">
          {MEALS.map((meal) => (
            <span key={meal}>
              <span className="bar" style={{ background: MEAL_COLORS[meal] }} />
              {t(`meal.${meal}`)}
            </span>
          ))}
        </div>
        <button type="button" className="today-btn" onClick={() => onPick(today)}>
          {t('diary.today')}
        </button>
      </div>
    </div>
  )
}
